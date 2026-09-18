<?php

function loadEnv($path)
{
    $vars = [];

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line)
    {
        if (strpos(trim($line), "#") === 0)
        {
            continue;
        }

        list($key, $value) = explode("=", $line, 2);
        $vars[trim($key)] = trim($value);
    }

    return $vars;
}

?>