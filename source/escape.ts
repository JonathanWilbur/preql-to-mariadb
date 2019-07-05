export default
function escape (str: string): string {
    return str
        .replace("'", "''")
        .replace("\\", "\\\\");
}