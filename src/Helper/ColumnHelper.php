<?php


namespace App\Helper;


class ColumnHelper
{
    public static function titleFromName(string $name): string
    {
        $name = trim(str_replace('_', ' ', $name));
        return ucfirst($name);
    }
}
