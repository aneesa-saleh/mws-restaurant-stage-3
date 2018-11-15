let loadElement = () => {};

/**
 * Function to call when an element comes into focus
 */
function handleIntersection(entries, observer) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const element = entry.target;
      observer.unobserve(element);
      requestAnimationFrame(() => {
        loadElement(element);
      });
    }
  });
}

function registerObserver(elementsToObserve, loadElementCallback) {
  loadElement = loadElementCallback;
  const observer = new IntersectionObserver(handleIntersection);
  elementsToObserve.forEach((element) => {
    observer.observe(element);
  });
}

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = resolve;
    image.onerror = reject;
  });
}
