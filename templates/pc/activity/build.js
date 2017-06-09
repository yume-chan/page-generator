module.exports = function build(html, preview) {
    return html.replace("{{TIME}}", preview ? "Hello" : new Date().toString());
}
