/* BlockToBeat : Library (#20)
   Les projets sont enregistrés sur l'appareil (IndexedDB), rangés dans des dossiers simples (un seul niveau).
   Un projet ouvert depuis la Library s'enregistre tout seul à chaque modification.
   Le Lab est utilisé seulement à travers window.BTB (voir index.html et CONTEXTE.md). */
(function(){
'use strict';
var BTB = window.BTB;
var page = document.getElementById('pg-library');
if (!BTB || !page) return;

/* ---------- Stockage ---------- */
var DB_NAME = 'blocktobeat-library' + BTB.storeSuffix, dbp = null;
function db(){
  if (dbp) return dbp;
  dbp = new Promise(function(res, rej){
    var r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = function(){
      var d = r.result;
      if (!d.objectStoreNames.contains('projects')) d.createObjectStore('projects', {keyPath:'id'});
      if (!d.objectStoreNames.contains('folders')) d.createObjectStore('folders', {keyPath:'id'});
    };
    r.onsuccess = function(){ res(r.result); };
    r.onerror = function(){ rej(r.error); };
  });
  return dbp;
}
function tx(store, mode, fn){
  return db().then(function(d){
    return new Promise(function(res, rej){
      var t = d.transaction(store, mode), st = t.objectStore(store), out = fn(st);
      t.oncomplete = function(){ res(out && 'result' in out ? out.result : out); };
      t.onerror = t.onabort = function(){ rej(t.error); };
    });
  });
}
function all(store){ return tx(store, 'readonly', function(st){ return st.getAll(); }); }
function get(store, id){ return tx(store, 'readonly', function(st){ return st.get(id); }); }
function put(store, v){ return tx(store, 'readwrite', function(st){ st.put(v); }); }
function del(store, id){ return tx(store, 'readwrite', function(st){ st.delete(id); }); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ---------- État de la page ---------- */
var projects = [], folders = [], filter = 'all';   /* 'all', 'none' (sans dossier) ou l'id d'un dossier */
function load(){
  return Promise.all([all('projects'), all('folders')]).then(function(r){
    projects = r[0].sort(function(a, b){ return b.updated - a.updated; });
    folders = r[1].sort(function(a, b){ return a.name.localeCompare(b.name, 'fr'); });
    if (filter !== 'all' && filter !== 'none' && !folders.some(function(f){ return f.id === filter; })) filter = 'all';
  });
}
function folderName(id){ var f = folders.filter(function(x){ return x.id === id; })[0]; return f ? f.name : 'Sans dossier'; }
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function ago(t){
  var s = (Date.now() - t)/1000;
  if (s < 60) return 'à l’instant';
  if (s < 3600) return 'il y a ' + Math.floor(s/60) + ' min';
  if (s < 86400) return 'il y a ' + Math.floor(s/3600) + ' h';
  if (s < 172800) return 'hier';
  return new Date(t).toLocaleDateString('fr-FR', {day:'numeric', month:'short'});
}
function defaultName(data){
  var t = data.stacks && data.stacks[0] && data.stacks[0].title;
  return t && t !== 'Nouveau groupe' ? t : 'Mon projet';
}

/* ---------- Affichage ---------- */
var ICON = {
  plus:'<path d="M12 5v14M5 12h14"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
};
function icon(k, sz){ return '<svg width="'+(sz||18)+'" height="'+(sz||18)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICON[k]+'</svg>'; }
function render(){
  var cur = BTB.getLibId();
  var list = projects.filter(function(p){ return filter === 'all' || (filter === 'none' ? !p.folderId : p.folderId === filter); });
  var h = '<div class="lib">'+
    '<header class="lib-head"><h2>Library</h2>'+
      '<div class="lib-actions"><button type="button" class="lib-btn" data-lib="new-folder">'+icon('folder')+'Dossier</button>'+
      '<button type="button" class="lib-btn lib-btn--main" data-lib="new-project">'+icon('plus')+'Nouveau projet</button></div></header>'+
    '<div class="lib-folders" role="tablist" aria-label="Dossiers">'+
      chip('all', 'Tous', projects.length)+
      folders.map(function(f){ return chip(f.id, f.name, projects.filter(function(p){ return p.folderId === f.id; }).length); }).join('')+
      (projects.some(function(p){ return !p.folderId; }) && folders.length ? chip('none', 'Sans dossier', projects.filter(function(p){ return !p.folderId; }).length) : '')+
    '</div>';
  if (filter !== 'all' && filter !== 'none') h += '<div class="lib-folder-bar"><span>'+icon('folder', 16)+esc(folderName(filter))+'</span><button type="button" class="lib-more" data-lib="folder-menu" aria-label="Options du dossier">'+icon('more')+'</button></div>';
  if (!projects.length) h += '<p class="lib-empty">Ta Library est vide. Enregistre ton projet depuis le Lab avec le bouton '+
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>'+
    ', ou crée un nouveau projet.</p>';
  else if (!list.length) h += '<p class="lib-empty">Ce dossier est vide. Déplace un projet ici avec son menu.</p>';
  else h += '<ul class="lib-list">'+list.map(function(p){
    var n = (p.data.stacks || []).length;
    return '<li class="lib-card'+(p.id === cur ? ' is-open' : '')+'">'+
      '<button type="button" class="lib-open" data-lib="open" data-id="'+p.id+'">'+
        '<strong>'+esc(p.name)+'</strong>'+
        '<span>'+(p.id === cur ? '<em>Ouvert dans le Lab</em> · ' : '')+n+' groupe'+(n > 1 ? 's' : '')+' · '+(p.data.bpm || 120)+' BPM'+(filter === 'all' && p.folderId ? ' · '+esc(folderName(p.folderId)) : '')+'</span>'+
        '<small>Modifié '+ago(p.updated)+'</small></button>'+
      '<button type="button" class="lib-more" data-lib="project-menu" data-id="'+p.id+'" aria-label="Options de '+esc(p.name)+'">'+icon('more')+'</button></li>';
  }).join('')+'</ul>';
  page.innerHTML = h + '</div>';
}
function chip(id, name, n){
  return '<button type="button" class="lib-chip" role="tab" data-lib="filter" data-id="'+id+'" aria-selected="'+(filter === id)+'">'+esc(name)+' <span>'+n+'</span></button>';
}
function refresh(){ return load().then(render); }

/* ---------- Feuille d'actions (menus, renommer, confirmer) ---------- */
var sheet = document.createElement('div');
sheet.className = 'lib-sheet'; sheet.hidden = true;
document.body.appendChild(sheet);
function closeSheet(){ sheet.hidden = true; sheet.innerHTML = ''; sheet.onclick = null; }
function openSheet(title, items){
  sheet.innerHTML = '<div class="lib-sheet-box" role="dialog" aria-label="'+esc(title)+'"><p class="lib-sheet-title">'+esc(title)+'</p>'+
    items.map(function(it, i){ return '<button type="button" class="lib-sheet-btn'+(it.danger ? ' danger' : '')+'" data-i="'+i+'">'+esc(it.label)+'</button>'; }).join('')+
    '<button type="button" class="lib-sheet-btn cancel" data-i="-1">Annuler</button></div>';
  sheet.hidden = false;
  sheet.onclick = function(e){
    if (e.target === sheet){ closeSheet(); return; }
    var b = e.target.closest('[data-i]'); if (!b) return;
    var it = items[+b.dataset.i]; closeSheet();
    if (it) it.run();
  };
}
function askName(title, value, ok){
  sheet.innerHTML = '<form class="lib-sheet-box" role="dialog" aria-label="'+esc(title)+'"><p class="lib-sheet-title">'+esc(title)+'</p>'+
    '<input class="lib-input" maxlength="40" value="'+esc(value)+'" aria-label="Nom">'+
    '<button type="submit" class="lib-sheet-btn main">OK</button><button type="button" class="lib-sheet-btn cancel" data-cancel="1">Annuler</button></form>';
  sheet.hidden = false;
  var f = sheet.querySelector('form'), inp = sheet.querySelector('input');
  inp.focus(); inp.select();
  f.onsubmit = function(e){ e.preventDefault(); var v = inp.value.trim().slice(0, 40); closeSheet(); if (v) ok(v); };
  sheet.onclick = function(e){ if (e.target === sheet || e.target.closest('[data-cancel]')) closeSheet(); };
}
function confirmSheet(title, label, run){ openSheet(title, [{label:label, danger:true, run:run}]); }

/* ---------- Actions ---------- */
function openProject(p){
  var data = JSON.parse(JSON.stringify(p.data)); data.libId = p.id;
  BTB.openProject(data);
  BTB.showPage('lab');
}
function createProject(data, name, folderId){
  var now = Date.now(), p = {id:uid(), name:name, folderId:folderId || null, created:now, updated:now, data:strip(data)};
  return put('projects', p).then(function(){ return p; });
}
function strip(data){ var d = JSON.parse(JSON.stringify(data)); delete d.libId; return d; }
function projectMenu(p){
  var items = [
    {label:'Ouvrir dans le Lab', run:function(){ openProject(p); }},
    {label:'Renommer', run:function(){ askName('Renommer le projet', p.name, function(v){ p.name = v; put('projects', p).then(refresh); }); }},
    {label:'Déplacer vers…', run:function(){ moveMenu(p); }},
    {label:'Dupliquer', run:function(){ createProject(p.data, p.name + ' (copie)', p.folderId).then(refresh); }},
    {label:'Supprimer', danger:true, run:function(){
      confirmSheet('Supprimer « '+p.name+' » ? C’est définitif.', 'Supprimer', function(){
        del('projects', p.id).then(function(){ if (BTB.getLibId() === p.id) BTB.setLibId(null); BTB.toast('Projet supprimé.'); refresh(); });
      });
    }}
  ];
  openSheet(p.name, items);
}
function moveMenu(p){
  var items = [{label:'Sans dossier', run:function(){ p.folderId = null; put('projects', p).then(refresh); }}]
    .concat(folders.map(function(f){ return {label:f.name, run:function(){ p.folderId = f.id; put('projects', p).then(refresh); }}; }))
    .concat([{label:'Nouveau dossier…', run:function(){ askName('Nouveau dossier', '', function(v){
      var f = {id:uid(), name:v, created:Date.now()};
      put('folders', f).then(function(){ p.folderId = f.id; return put('projects', p); }).then(refresh);
    }); }}]);
  openSheet('Déplacer « '+p.name+' »', items);
}
function folderMenu(f){
  openSheet(f.name, [
    {label:'Renommer le dossier', run:function(){ askName('Renommer le dossier', f.name, function(v){ f.name = v; put('folders', f).then(refresh); }); }},
    {label:'Supprimer le dossier', danger:true, run:function(){
      confirmSheet('Supprimer le dossier « '+f.name+' » ? Ses projets ne sont pas supprimés, ils passent dans « Sans dossier ».', 'Supprimer le dossier', function(){
        var moves = projects.filter(function(p){ return p.folderId === f.id; }).map(function(p){ p.folderId = null; return put('projects', p); });
        Promise.all(moves).then(function(){ return del('folders', f.id); }).then(function(){ filter = 'all'; refresh(); });
      });
    }}
  ]);
}
page.addEventListener('click', function(e){
  var b = e.target.closest('[data-lib]'); if (!b) return;
  var a = b.dataset.lib, p = projects.filter(function(x){ return x.id === b.dataset.id; })[0];
  if (a === 'filter'){ filter = b.dataset.id; render(); return; }
  if (a === 'open' && p){ openProject(p); return; }
  if (a === 'project-menu' && p){ projectMenu(p); return; }
  if (a === 'folder-menu'){ var f = folders.filter(function(x){ return x.id === filter; })[0]; if (f) folderMenu(f); return; }
  if (a === 'new-folder'){ askName('Nouveau dossier', '', function(v){ var f = {id:uid(), name:v, created:Date.now()}; put('folders', f).then(function(){ filter = f.id; refresh(); }); }); return; }
  if (a === 'new-project'){
    askName('Nouveau projet', 'Mon projet', function(v){
      var folderId = filter !== 'all' && filter !== 'none' ? filter : null, data = {bpm:120, stacks:[], mode:'loop', lanes:[[]]};
      createProject(data, v, folderId).then(function(p){ openProject(p); });
    });
  }
});

/* Bouton « Enregistrer dans la Library » du Lab */
document.addEventListener('btb:library-save', function(){
  var data = BTB.getProject();
  createProject(data, defaultName(data), null).then(function(p){
    BTB.setLibId(p.id);
    BTB.toast('Enregistré dans la Library : « '+p.name+' ». Il s’enregistre maintenant tout seul.', 3500);
    load();
  });
});

/* Enregistrement automatique du projet ouvert, regroupé pour ne pas écrire à chaque note du REC */
var saveT = 0;
BTB.onChange(function(){
  if (!BTB.getLibId()) return;
  clearTimeout(saveT);
  saveT = setTimeout(function(){
    var id = BTB.getLibId(); if (!id) return;
    get('projects', id).then(function(p){
      if (!p){ BTB.setLibId(null); return; }   /* supprimé entre-temps : on ne le recrée pas */
      p.data = strip(BTB.getProject()); p.updated = Date.now();
      return put('projects', p);
    });
  }, 600);
});

document.addEventListener('btb:nav', function(e){ if (e.detail && e.detail.page === 'library') refresh(); else closeSheet(); });
document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
refresh();
})();
