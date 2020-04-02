<?php
register_hook('database-markers', function (&$def, $options) {
  $def['additional_filters']['commentedBetween'] = array(
    'compile' => function ($value, $db) {
      if ($value['>='] || $value['<=']) {
        return
          "(select count(*)>0 from map_comments where marker=map_markers.id" .
          ($value['>='] ? " and map_comments.date>=" . $db->quote($value['>=']) : "") .
          ($value['<='] ? " and map_comments.date<=" . $db->quote($value['<=']) : "") .
          ")";
      }

      return null;
    }
  );
});
