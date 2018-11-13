let loadElement = () => {};

function handleIntersection(entries, observer) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const element = entry.target;
      observer.unobserve(element);
      loadElement(element);
    }
  });
}

function registerObserver(elementsToObserve, loadElementCallback) {
  loadElement = loadElementCallback;
  const options = {
    threshold: 0.1,
    rootMargin: '0px',
  };
  const observer = new IntersectionObserver(handleIntersection, options);
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
