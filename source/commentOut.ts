export default
function commentOut(uncommentedText: string): string {
    return ('-- ' + uncommentedText.replace(/--/g, '\\-\\-').replace(/\r?\n/g, '\r\n-- '));
};
