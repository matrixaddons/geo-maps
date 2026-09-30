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
