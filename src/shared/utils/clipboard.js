export const copyToClipboard = async (text) => {
    // Attempt modern Clipboard API first if available and secure context
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.warn('Modern Clipboard API failed, attempting fallback...', err);
        }
    }

    // Fallback using older execCommand approach for HTTP / older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Prevent scrolling or visual glitches
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let successful = false;
    try {
        successful = document.execCommand('copy');
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }

    document.body.removeChild(textArea);
    return successful;
};
