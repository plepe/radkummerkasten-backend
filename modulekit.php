<?php
$id = "radkummerkasten-tools";
$name = "radkummerkasten-tools";
$depend = array("modulekit-form", "PDOext", "modulekit-auth", "auth-user-menu", "modulekit-auth-js", "modulekit-ajax", "db-api");
$include = array(
  'php' => array(
    'src/database.php',
    'src/commentedBetween.php',
  ),
);
$version = "0.6.3";
