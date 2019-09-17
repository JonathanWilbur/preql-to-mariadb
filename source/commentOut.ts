export default
function commentOut (uncommentedText: string): string {
    return ("-- " + uncommentedText.replace(/--/gu, "\\-\\-").replace(/\r?\n/gu, "\r\n-- "));
}
