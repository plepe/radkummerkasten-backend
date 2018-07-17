<?php include "conf.php"; /* load a local configuration */ ?>
<?php include "vendor/autoload.php"; ?>
<?php include "modulekit/loader.php"; /* loads all php-includes */ ?>
<?php session_start(); ?>
<?php call_hooks("init"); /* initialize submodules */ ?>
<?php html_export_var(array('twigGlobal' => $twigGlobal)); ?>
<html>
<head>
  <meta charset="utf-8">
  <title>Radkummerkasten Backend</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css?<?=$modulekit['version']?>" />
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
  <script src="dist/index.js?<?=$modulekit['version']?>"></script>
  <script src="node_modules/leaflet/dist/leaflet.js"></script>
  <?php print modulekit_to_javascript(); /* pass modulekit configuration to JavaScript */ ?>
  <?php print modulekit_include_js(); /* prints all js-includes */ ?>
  <?php print modulekit_include_css(); /* prints all css-includes */ ?>
  <?php print_add_html_headers(); /* print additional html headers */ ?>
</head>
<body>
<?php print auth_user_menu() ?>

<h1><a href='#'>Radkummerkasten Backend</a></h1>

<div id='menu'>
<div id='menuOverview'>
<form id='filterOverview' onSubmit='return false;'>
</form>
</div>

<div id='menuShow'>
<form id='filterShow'>
<input type='hidden' name='filterId' value=''/>
</form>
</div>

<ul id='menu-top' class='menu'>
  <li><a href='javascript:openDownload()'>Exportieren</a></li>
  <li><a href='javascript:update(true, false)'>Neu laden</a></li>
</ul>

<form id='downloadForm' onSubmit='return submitDownloadForm()'>
  <div id='downloadOptions'>
  </div>
  <input type='submit' value='Generiere Datei' />
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
<p>Das <a href='https://github.com/plepe/radkummerkasten-backend'>Radkummerkasten Backend</a> wird von Stephan Bösch-Plepelits entwickelt.
Es ist Open Source und wird auf Github entwickelt. Kommentare, Bug
Reports und Erweiterungen sind herzlich willkommen.</p>
<p>Version: <a target='_blank' id='version' href='https://github.com/plepe/radkummerkasten-backend/blob/master/CHANGELOG.md'></a></p>
</body>
</html>
