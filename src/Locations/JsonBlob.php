<?php
/**
 * JSON text kept as text: a cached file (or string) that a REST response can
 * send as is, and that still encodes normally when a caller asks for the data.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Locations;

defined('ABSPATH') || exit;

/**
 * JSON blob.
 */
final class JsonBlob implements \JsonSerializable
{
    /**
     * File path ('' for a string).
     *
     * @var string
     */
    public $path;

    /**
     * JSON text when there is no file.
     *
     * @var string
     */
    private $json;

    /**
     * Constructor.
     *
     * @param string $path File.
     * @param string $json JSON text (when there is no file).
     */
    public function __construct($path, $json = '')
    {
        $this->path = (string) $path;
        $this->json = (string) $json;
    }

    /**
     * The JSON text.
     *
     * @return string
     */
    public function text()
    {
        return '' !== $this->path ? (string) file_get_contents($this->path) : $this->json; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
    }

    /**
     * Decoded data.
     *
     * @return mixed
     */
    #[\ReturnTypeWillChange]
    public function jsonSerialize()
    {
        return json_decode($this->text(), true);
    }

    /**
     * Decoded data with only some entries of one top-level list, decoding one
     * entry at a time (a big file is never decoded as a whole: decoded, 20,000
     * locations take several times the memory of their JSON text).
     *
     * @param string $key Top-level key of the list (items, features).
     * @param callable $keep Gets a decoded entry, returns whether to keep it.
     * @param bool $as_json Return the result as JSON text (what wp_json_encode() makes of the
     *                      data), which takes far less memory than the decoded data.
     * @return array|string|null Data (as jsonSerialize(), with the list filtered), or null when the text is not as expected.
     * @since 2.1.0
     */
    public function filter_list($key, $keep, $as_json = false)
    {
        $text = $this->text();
        $open = '"' . $key . '":[';
        $at = strpos($text, $open);

        if (false === $at) {
            return null;
        }

        $start = $at + strlen($open);
        $pos = $start;
        $kept = array();
        // One JSON object or array (strings may hold any bracket), after an optional comma.
        $entry = '/\G,?((?:[\{\[](?:[^\{\}\[\]"]++|"(?:[^"\\\\]++|\\\\.)*+"|(?1))*+[\}\]]))/';

        while (preg_match($entry, $text, $m, 0, $pos)) {
            $pos += strlen($m[0]);
            $item = json_decode($m[1], true);
            if (null === $item) {
                return null;
            }
            if ($keep($item)) {
                $kept[] = $as_json ? wp_json_encode($item) : $item;
            }
        }

        if (']' !== substr($text, $pos, 1)) {
            return null; // Not the end of the list: an entry that isn't an object or array.
        }

        // Everything else in the file, with the list emptied.
        $data = json_decode(substr($text, 0, $start) . substr($text, $pos), true);
        unset($text);

        if (!is_array($data) || !array_key_exists($key, $data)) {
            return null;
        }

        if (!$as_json) {
            $data[$key] = $kept;
            return $data;
        }

        // The rest encoded as usual, the kept entries put into its emptied list.
        $data[$key] = array();
        $json = wp_json_encode($data);
        $empty = '"' . $key . '":[]';
        $at = is_string($json) ? strpos($json, $empty) : false;

        if (false === $at) {
            return null;
        }
        $at += strlen($empty) - 1;

        return substr($json, 0, $at) . implode(',', $kept) . substr($json, $at);
    }

    /**
     * Send the JSON text.
     */
    public function output()
    {
        if ('' !== $this->path) {
            readfile($this->path); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile
        } else {
            echo $this->json; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON built by the plugin.
        }
    }

    /**
     * Validator for HTTP caching.
     *
     * @return string
     */
    public function etag()
    {
        return '"' . md5('' !== $this->path ? $this->path . '|' . (int) @filemtime($this->path) : $this->json) . '"'; // phpcs:ignore WordPress.PHP.NoSilencedErrors
    }
}
