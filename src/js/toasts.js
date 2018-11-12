let toastTimer = null;
const pendingToasts = [];

function clearToastTimer() {
  clearTimeout(toastTimer);
  toastTimer = null;
}

function enqueueToast(message, type) {
  // add the toast to the beginning of the array (queue)
  pendingToasts.unshift({ message, type });
  if (toastTimer === null) { // no toast is currently showing
    showToast();
  }
}

function hideToast() {
  clearTimeout(toastTimer);
  toastTimer = null;
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  toast.classList.remove('show');
  setTimeout(() => {
    toastText.setAttribute('aria-live', 'polite');
    // show the next toast if there is any pending
    showToast();
  }, 0);
}

function showToast() {
  const toast = pendingToasts.pop();
  if (!toast || !toast.message) return;

  const { message, type } = toast;
  const toastElement = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  const toastIcon = document.getElementById('toast-icon');

  toastText.setAttribute('aria-live', 'polite');
  toastText.innerHTML = message;

  if (type === 'error') {
    toastElement.className = 'toast show error';
    toastIcon.className = 'fas fa-exclamation-triangle';
  } else if (type === 'success') {
    toastElement.className = 'toast show success';
    toastIcon.className = 'fas fa-check';
  } else {
    toastElement.className = 'toast show';
    toastIcon.className = 'fas fa-info-circle';
  }

  clearTimeout(toastTimer);
  setTimeout(() => {
    toastText.setAttribute('aria-live', 'off');
  }, 0);
  toastTimer = setTimeout(hideToast, 10000);
}
