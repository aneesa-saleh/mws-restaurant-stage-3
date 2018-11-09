/****** modal *******/

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

/****** handle errors *******/

function setNameInputError() {
  const nameInput = document.getElementById('name');
  const nameInputError = document.getElementById('name-error');
  nameInput.classList.add('has-error');
  nameInput.setAttribute('aria-invalid', 'true');
  nameInput.setAttribute('aria-describedby', 'name-error');
  nameInputError.classList.add('show');
}

function clearNameInputError() {
  const nameInput = document.getElementById('name');
  const nameInputError = document.getElementById('name-error');
  nameInput.classList.remove('has-error');
  nameInput.removeAttribute('aria-invalid');
  nameInput.removeAttribute('aria-describedby');
  nameInputError.classList.remove('show');
}

function setRatingInputError() {
  const ratingInput = document.getElementById('rating');
  const ratingInputError = document.getElementById('rating-error');
  ratingInput.classList.add('has-error');
  ratingInput.setAttribute('aria-invalid', 'true');
  ratingInput.setAttribute('aria-describedby', 'rating-error');
  ratingInputError.classList.add('show');
}

function clearRatingInputError() {
  const ratingInput = document.getElementById('rating');
  const ratingInputError = document.getElementById('rating-error');
  ratingInput.classList.remove('has-error');
  ratingInput.removeAttribute('aria-invalid');
  ratingInput.removeAttribute('aria-describedby');
  ratingInputError.classList.remove('show');
}

function setCommentInputError() {
  const commentInput = document.getElementById('comment');
  const commentInputError = document.getElementById('comment-error');
  commentInput.classList.add('has-error');
  commentInput.setAttribute('aria-invalid', 'true');
  commentInput.setAttribute('aria-describedby', 'comment-error');
  commentInputError.classList.add('show');
}

function clearCommentInputError() {
  const commentInput = document.getElementById('comment');
  const commentInputError = document.getElementById('comment-error');
  commentInput.classList.remove('has-error');
  commentInput.removeAttribute('aria-invalid');
  commentInput.removeAttribute('aria-describedby');
  commentInputError.classList.remove('show');
}

const errorFunctions = {
  name: {
    setError: setNameInputError,
    clearError: clearNameInputError,
  },
  rating: {
    setError: setRatingInputError,
    clearError: clearRatingInputError,
  },
  comment: {
    setError: setCommentInputError,
    clearError: clearCommentInputError,
  }
};

/****** validation *******/

function validateInput(id) {
  const input = document.getElementById(id).cloneNode();
  const value = id === 'rating'? Number.parseInt(input.value, 10) : input.value;
  if (value) {
    errorFunctions[id].clearError();
    return true;
  } else {
    errorFunctions[id].setError();
    return false;
  }
}

function validateAllInputs() {
  let allInputsValid = true;
  const inputIds = ['name', 'rating', 'comment'];
  inputIds.forEach((id) => {
    const inputValid = validateInput(id);
    allInputsValid = allInputsValid && inputValid;
  });
  return allInputsValid;
}

/****** handle events *******/

function handleRangeChange(event) {
  var ratingValue = document.querySelector('.rating-value');
  ratingValue.innerHTML = `${event.target.value}.0`;
}

function handleNameInputBlur() {
  validateInput('name');
}

function handleRatingInputBlur() {
  validateInput('rating');
}

function handleCommentInputBlur() {
  validateInput('comment');
}

function getFormInputValues() {
  const inputIds = ['name', 'rating', 'comment'];
  const values = {};
  inputIds.forEach((id) => {
    values[id] = document.getElementById(id).value;
  });
  return values;
}

function clearForm() {
  document.getElementById('name').value = '';
  document.getElementById('rating').value = '0';
  document.querySelector('.rating-value').innerHTML = '0.0';
  document.getElementById('comment').value = '';
}

function handleAddReviewSubmit() {
  const allInputsValid = validateAllInputs();
  if (allInputsValid) {
    const { name, rating, comment } = getFormInputValues();
    if (navigator.serviceWorker) { // perform regular fetch and regular updates
      const submitButton = document.getElementById('add-review-submit');
      submitButton.setAttribute('disabled', true);
      submitButton.setAttribute('aria-busy', 'true');
      DBHelper.addReview(self.restaurant.id, name, rating, comment, (error, newReview) => {
        submitButton.removeAttribute('disabled');
        submitButton.setAttribute('aria-busy', 'false');
        if (error) {
          // TODO: toast error
          console.log(error);
        } else {
          // TODO: toast success
          const ul = document.getElementById('reviews-list');
          ul.appendChild(createReviewHTML(newReview));
        }
        closeModal();
        clearForm();
      });
    } else {

    }
  }
}
