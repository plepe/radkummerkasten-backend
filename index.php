<?php include "conf.php"; /* load a local configuration */ ?>
<?php include "modulekit/loader.php"; /* loads all php-includes */ ?>
<?php call_hooks("init"); /* initialize submodules */ ?>
<!DOCTYPE HTML>
<html>
<head>
  <meta charset="utf-8">
  <title>radkummerkasten-tools</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css" />
  <link rel="stylesheet" href="node_modules/leaflet/dist/leaflet.css"/>
  <style>
.leaflet-popup-content {
  max-height: 250px;
  overflow: auto;
}
.leaflet-popup-content pre {
  font-size: 8px;
}
  </style>
  <script src="dist/index.js"></script>
  <script src="node_modules/leaflet/dist/leaflet.js"></script>
  <?php print modulekit_to_javascript(); /* pass modulekit configuration to JavaScript */ ?>
  <?php print modulekit_include_js(); /* prints all js-includes */ ?>
  <?php print modulekit_include_css(); /* prints all css-includes */ ?>
  <?php print_add_html_headers(); /* print additional html headers */ ?>
</head>
<body>

<h1><a href='#'>Radkummerkasten</a></h1>

<div id='menu'>
<div id='menuOverview'>
<form id='filterOverview' onChange='return update(false, true)' onSubmit='return false;'>
  <select name='bezirk'>
    <option value='*'>* Bezirk *</option>
  </select>
  <select name='category'>
    <option value='*'>* Kategorie *</option>
  </select>
  <input name='user' value='' placeholder='Autor (Eintrag, Kommentar)'/>
  <span name='date'>
    <input name='date_start' value='' placeholder='Erstellungsdatum von (YYYY-MM-DD)'/>
    <input name='date_end' value='' placeholder='Erstellungsdatum bis (YYYY-MM-DD)'/>
  </span>
  <select name='order'>
    <option value='lastComment'>Neueste Kommentare bzw. Einträge zuerst</option>
    <option value='id'>Neueste Einträge zuerst</option>
    <option value='likes'>Einträge mit den meisten Unterstützungen zuerst</option>
    <option value='commentsCount'>Einträge mit den meisten Kommentaren zuerst</option>
    <option value='lastUpdate'>Einträge sortiert nach letzter Änderung</option>
  </select>
</form>
</div>

<div id='menuShow'>
<form id='filterShow'>
<input type='hidden' name='filterId' value=''/>
</form>
</div>

<a href='javascript:openDownload()'>Download</a> |
<a href='javascript:update(true, false)'>Reload</a> (Stand: <span id='timestamp'></span>)

<form id='downloadOptions' onSubmit='return submitDownloadForm()'>
  <div class='downloadOption'>
    Dateityp:
    <select name='fileType' onChange='updateDownloadForm()'>
      <option value='csv'>CSV (Comma Separated Value, e.g. Excel)</option>
      <option value='geojson'>GeoJSON (GIS-Applications, e.g. qGIS)</option>
      <option value='html'>HTML</option>
      <option value='office'>Office (HTML, optimiert für den Import in LibreOffice/OpenOffice)</option>
    </select>
  </div>
  <div class='downloadOption' downloadTypes='csv'>
    <input name='includeDetails' type='checkbox' />Inkludiere Details für Einträge
  </div>
  <div class='downloadOption' downloadTypes='html,office'>
    <input name='embedImgs' type='checkbox' />Bilder einbetten
  </div>
  <div class='downloadOption' downloadTypes='html,office'>
    <input name='noMap' type='checkbox' />Keine Karte inkludieren
  </div>
  <input type='submit' value='Generiere Download' />
  <span id='download'></span>
</form>

</div>

<hr/>

<div id='pageOverview'>
</div>

<div id='pageShow'>
</div>

<hr/>
<p>
Diese Webseite ist nicht Teil des offiziellen <a href='http://www.radkummerkasten.at'>Radkummerkastens</a>, sondern verwendet nur die Daten aus diesem.</p>
<p>Die <a href='https://github.com/plepe/radkummerkasten-tools'>radkummerkasten-tools</a> werden von Stephan Bösch-Plepelits entwickelt.
Diese sind Open Source und werden auf Github entwickelt. Kommentare, Bug
Reports und Erweiterungen sind herzlich willkommen.</p>
<p>Version: <a target='_blank' id='version' href='https://github.com/plepe/radkummerkasten-tools/blob/master/CHANGELOG.md'></a></p>
</body>
</html>
