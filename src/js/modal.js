function openModal() {
  previouslyFocusedElement = document.activeElement;
  const overlay = document.querySelector('.overlay');
  const interactiveElements = overlay.querySelectorAll('button, input, textarea');
  overlay.classList.add('show');
  document.body.classList.add('has-open-modal');
  document.addEventListener('keydown', trapTabKey);
  setTimeout(function(){ interactiveElements[0].focus(); }, 100);
}

function closeModal() {
  document.querySelector('.overlay').classList.remove('show');
  document.body.classList.remove('has-open-modal');
  document.removeEventListener('keydown', trapTabKey);
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
  }
}

function trapTabKey(event) {
  const overlay = document.querySelector('.overlay');
  const interactiveElements = overlay.querySelectorAll('button, input');
  const TAB = 9;
  const firstElement = interactiveElements[0];
  const lastElement = interactiveElements[interactiveElements.length - 1];
  if (event.keyCode === TAB) {
    if (event.shiftKey && event.target === firstElement) { // shift + tab
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && event.target === lastElement) { // tab
      event.preventDefault();
      firstElement.focus();
    }
  }
}
