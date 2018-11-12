"use strict";

/** **** modal ****** */
var previouslyFocusedElement;

function openModal() {
  previouslyFocusedElement = document.activeElement;
  var overlay = document.querySelector('.overlay');
  var interactiveElements = overlay.querySelectorAll('button, input, textarea');
  overlay.classList.add('show');
  document.body.classList.add('has-open-modal');
  document.addEventListener('keydown', trapTabKey); // focus the first element in the overlay. timeout is needed because of CSS transition

  setTimeout(function () {
    interactiveElements[0].focus();
  }, 100);
}

function closeModal() {
  clearFormErrors();
  document.querySelector('.overlay').classList.remove('show');
  document.body.classList.remove('has-open-modal');
  document.removeEventListener('keydown', trapTabKey);

  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
  }
}

function trapTabKey(event) {
  var overlay = document.querySelector('.overlay');
  var interactiveElements = overlay.querySelectorAll('button, input');
  var firstElement = interactiveElements[0];
  var lastElement = interactiveElements[interactiveElements.length - 1];

  if (event.key && event.key === 'Tab') {
    if (event.shiftKey && event.target === firstElement) {
      // shift + tab
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && event.target === lastElement) {
      // tab
      event.preventDefault();
      firstElement.focus();
    }
  }
}
/** **** handle errors ****** */


function setNameInputError() {
  var nameInput = document.getElementById('name');
  var nameInputError = document.getElementById('name-error');
  nameInput.classList.add('has-error');
  nameInput.setAttribute('aria-invalid', 'true');
  nameInput.setAttribute('aria-describedby', 'name-error');
  nameInputError.classList.add('show');
}

function clearNameInputError() {
  var nameInput = document.getElementById('name');
  var nameInputError = document.getElementById('name-error');
  nameInput.classList.remove('has-error');
  nameInput.removeAttribute('aria-invalid');
  nameInput.removeAttribute('aria-describedby');
  nameInputError.classList.remove('show');
}

function setRatingInputError() {
  var ratingInput = document.getElementById('rating');
  var ratingInputError = document.getElementById('rating-error');
  ratingInput.classList.add('has-error');
  ratingInput.setAttribute('aria-invalid', 'true');
  ratingInput.setAttribute('aria-describedby', 'rating-error');
  ratingInputError.classList.add('show');
}

function clearRatingInputError() {
  var ratingInput = document.getElementById('rating');
  var ratingInputError = document.getElementById('rating-error');
  ratingInput.classList.remove('has-error');
  ratingInput.removeAttribute('aria-invalid');
  ratingInput.removeAttribute('aria-describedby');
  ratingInputError.classList.remove('show');
}

function setCommentInputError() {
  var commentInput = document.getElementById('comments');
  var commentInputError = document.getElementById('comments-error');
  commentInput.classList.add('has-error');
  commentInput.setAttribute('aria-invalid', 'true');
  commentInput.setAttribute('aria-describedby', 'comments-error');
  commentInputError.classList.add('show');
}

function clearCommentInputError() {
  var commentInput = document.getElementById('comments');
  var commentInputError = document.getElementById('comments-error');
  commentInput.classList.remove('has-error');
  commentInput.removeAttribute('aria-invalid');
  commentInput.removeAttribute('aria-describedby');
  commentInputError.classList.remove('show');
}

var errorFunctions = {
  name: {
    setError: setNameInputError,
    clearError: clearNameInputError
  },
  rating: {
    setError: setRatingInputError,
    clearError: clearRatingInputError
  },
  comments: {
    setError: setCommentInputError,
    clearError: clearCommentInputError
  }
};
/** **** validation ****** */

function validateInput(id, value) {
  var input = document.getElementById(id).cloneNode();
  var inputValue;

  if (value !== undefined) {
    inputValue = value;
  } else {
    inputValue = input.value;
  }

  inputValue = id === 'rating' ? Number.parseInt(inputValue, 10) : inputValue;

  if (inputValue) {
    errorFunctions[id].clearError();
    return true;
  }

  requestAnimationFrame(errorFunctions[id].setError);
  return false;
}

function validateAllInputs() {
  var error = false;
  var inputIds = ['name', 'rating', 'comments'];
  var invalidInputs = [];
  inputIds.forEach(function (id) {
    var inputValid = validateInput(id);

    if (!inputValid) {
      invalidInputs.push(id);
      error = true;
    }
  });
  return {
    error: error,
    invalidInputs: invalidInputs
  };
}
/** **** handle events ****** */


function handleRangeChange(event) {
  var ratingValue = document.querySelector('.rating-value');
  ratingValue.innerHTML = "".concat(event.target.value, ".0");
  validateInput(event.target.name, event.target.value);
}

function handleInputKeyUp(event) {
  if (!(event.key && event.key === 'Tab')) {
    // when tab is used, allow the onblur handler to perform validation
    // when the tab key is pressed, focus is already on the next input when the event fires
    // so the wrong input is validated
    validateInput(event.target.name, event.target.value);
  }
}

function handleInputBlur(event) {
  validateInput(event.target.name, event.target.value);
}

function getFormInputValues() {
  var inputIds = ['name', 'rating', 'comments'];
  var values = {};
  inputIds.forEach(function (id) {
    values[id] = document.getElementById(id).value;
  });
  return values;
}

function clearForm() {
  document.getElementById('name').value = '';
  document.getElementById('rating').value = '0';
  document.querySelector('.rating-value').innerHTML = '0.0';
  document.getElementById('comments').value = '';
}

function clearFormErrors() {
  document.getElementById('name-error').classList.remove('show');
  document.getElementById('rating-error').classList.remove('show');
  document.getElementById('comments-error').classList.remove('show');
  document.getElementById('add-review-form-error').classList.remove('show');
  document.getElementById('add-review-form-error').innerHTML = '';
  document.getElementById('name').classList.remove('has-error');
  document.getElementById('rating').classList.remove('has-error');
  document.getElementById('comments').classList.remove('has-error');
}

function handleAddReviewSubmit() {
  var _validateAllInputs = validateAllInputs(),
      error = _validateAllInputs.error,
      invalidInputs = _validateAllInputs.invalidInputs;

  if (!error) {
    var _getFormInputValues = getFormInputValues(),
        name = _getFormInputValues.name,
        rating = _getFormInputValues.rating,
        comments = _getFormInputValues.comments;

    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      // perform regular fetch and regular updates
      var submitButton = document.getElementById('add-review-submit');
      submitButton.setAttribute('disabled', true);
      submitButton.setAttribute('aria-busy', 'true');
      DBHelper.addReview(self.restaurant.id, name, rating, comments, function (error, newReview) {
        submitButton.removeAttribute('disabled');
        submitButton.setAttribute('aria-busy', 'false');

        if (error) {
          enqueueToast('An error occurred. Please try again', 'error');
          console.log(error);
        } else {
          enqueueToast("".concat(name, "'s review has been saved"), 'success');
          var ul = document.getElementById('reviews-list');
          ul.insertBefore(createReviewHTML(newReview), ul.firstChild);
          closeModal();
          clearForm();
        }
      });
    } else {
      var requestId = "".concat(self.restaurant.id, "-").concat(Date.now());
      var newReview = {
        name: name,
        rating: rating,
        comments: comments,
        restaurant_id: self.restaurant.id
      };
      var ul = document.getElementById('reviews-list');
      ul.insertBefore(createReviewHTML(newReview, true, requestId), ul.firstChild);

      if ('onLine' in navigator && !navigator.onLine) {
        enqueueToast('Your review will be submitted when you are back online');
      }

      closeModal();
      clearForm();
      navigator.serviceWorker.controller.postMessage({
        type: 'post-review',
        review: newReview,
        requestId: requestId
      });
    }
  } else {
    // form errors not cleared
    var formError = document.getElementById('add-review-form-error');
    var errorText = "Invalid input for: ".concat(invalidInputs.join(', '));
    formError.innerHTML = errorText;
    formError.classList.add('show');
    document.getElementById(invalidInputs[0]).focus();
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFkZFJldmlld01vZGFsLmpzIl0sIm5hbWVzIjpbInByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCIsIm9wZW5Nb2RhbCIsImRvY3VtZW50IiwiYWN0aXZlRWxlbWVudCIsIm92ZXJsYXkiLCJxdWVyeVNlbGVjdG9yIiwiaW50ZXJhY3RpdmVFbGVtZW50cyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJjbGFzc0xpc3QiLCJhZGQiLCJib2R5IiwiYWRkRXZlbnRMaXN0ZW5lciIsInRyYXBUYWJLZXkiLCJzZXRUaW1lb3V0IiwiZm9jdXMiLCJjbG9zZU1vZGFsIiwiY2xlYXJGb3JtRXJyb3JzIiwicmVtb3ZlIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImV2ZW50IiwiZmlyc3RFbGVtZW50IiwibGFzdEVsZW1lbnQiLCJsZW5ndGgiLCJrZXkiLCJzaGlmdEtleSIsInRhcmdldCIsInByZXZlbnREZWZhdWx0Iiwic2V0TmFtZUlucHV0RXJyb3IiLCJuYW1lSW5wdXQiLCJnZXRFbGVtZW50QnlJZCIsIm5hbWVJbnB1dEVycm9yIiwic2V0QXR0cmlidXRlIiwiY2xlYXJOYW1lSW5wdXRFcnJvciIsInJlbW92ZUF0dHJpYnV0ZSIsInNldFJhdGluZ0lucHV0RXJyb3IiLCJyYXRpbmdJbnB1dCIsInJhdGluZ0lucHV0RXJyb3IiLCJjbGVhclJhdGluZ0lucHV0RXJyb3IiLCJzZXRDb21tZW50SW5wdXRFcnJvciIsImNvbW1lbnRJbnB1dCIsImNvbW1lbnRJbnB1dEVycm9yIiwiY2xlYXJDb21tZW50SW5wdXRFcnJvciIsImVycm9yRnVuY3Rpb25zIiwibmFtZSIsInNldEVycm9yIiwiY2xlYXJFcnJvciIsInJhdGluZyIsImNvbW1lbnRzIiwidmFsaWRhdGVJbnB1dCIsImlkIiwidmFsdWUiLCJpbnB1dCIsImNsb25lTm9kZSIsImlucHV0VmFsdWUiLCJ1bmRlZmluZWQiLCJOdW1iZXIiLCJwYXJzZUludCIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInZhbGlkYXRlQWxsSW5wdXRzIiwiZXJyb3IiLCJpbnB1dElkcyIsImludmFsaWRJbnB1dHMiLCJmb3JFYWNoIiwiaW5wdXRWYWxpZCIsInB1c2giLCJoYW5kbGVSYW5nZUNoYW5nZSIsInJhdGluZ1ZhbHVlIiwiaW5uZXJIVE1MIiwiaGFuZGxlSW5wdXRLZXlVcCIsImhhbmRsZUlucHV0Qmx1ciIsImdldEZvcm1JbnB1dFZhbHVlcyIsInZhbHVlcyIsImNsZWFyRm9ybSIsImhhbmRsZUFkZFJldmlld1N1Ym1pdCIsIm5hdmlnYXRvciIsInNlcnZpY2VXb3JrZXIiLCJjb250cm9sbGVyIiwic3VibWl0QnV0dG9uIiwiREJIZWxwZXIiLCJhZGRSZXZpZXciLCJzZWxmIiwicmVzdGF1cmFudCIsIm5ld1JldmlldyIsImVucXVldWVUb2FzdCIsImNvbnNvbGUiLCJsb2ciLCJ1bCIsImluc2VydEJlZm9yZSIsImNyZWF0ZVJldmlld0hUTUwiLCJmaXJzdENoaWxkIiwicmVxdWVzdElkIiwiRGF0ZSIsIm5vdyIsInJlc3RhdXJhbnRfaWQiLCJvbkxpbmUiLCJwb3N0TWVzc2FnZSIsInR5cGUiLCJyZXZpZXciLCJmb3JtRXJyb3IiLCJlcnJvclRleHQiLCJqb2luIiwiaGFuZGxlRm9ybVN1Ym1pdCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUVBLElBQUlBLHdCQUFKOztBQUVBLFNBQVNDLFNBQVQsR0FBcUI7QUFDbkJELEVBQUFBLHdCQUF3QixHQUFHRSxRQUFRLENBQUNDLGFBQXBDO0FBQ0EsTUFBTUMsT0FBTyxHQUFHRixRQUFRLENBQUNHLGFBQVQsQ0FBdUIsVUFBdkIsQ0FBaEI7QUFDQSxNQUFNQyxtQkFBbUIsR0FBR0YsT0FBTyxDQUFDRyxnQkFBUixDQUF5Qix5QkFBekIsQ0FBNUI7QUFDQUgsRUFBQUEsT0FBTyxDQUFDSSxTQUFSLENBQWtCQyxHQUFsQixDQUFzQixNQUF0QjtBQUNBUCxFQUFBQSxRQUFRLENBQUNRLElBQVQsQ0FBY0YsU0FBZCxDQUF3QkMsR0FBeEIsQ0FBNEIsZ0JBQTVCO0FBQ0FQLEVBQUFBLFFBQVEsQ0FB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QUFJLEVBQUUsYUFEdUM7QUFFN0NDLFFBQUFBLE1BQU0sRUFBRWYsU0FGcUM7QUFHN0NRLFFBQUFBLFNBQVMsRUFBVEE7QUFINkMsT0FBL0M7QUFLRDtBQUNGLEdBekNELE1BeUNPO0FBQUU7QUFDUCxRQUFNUSxTQUFTLEdBQUdoRyxRQUFRLENBQUMyQixjQUFULENBQXdCLHVCQUF4QixDQUFsQjtBQUNBLFFBQU1zRSxTQUFTLGdDQUF5QnRDLGFBQWEsQ0FBQ3VDLElBQWQsQ0FBbUIsSUFBbkIsQ0FBekIsQ0FBZjtBQUNBRixJQUFBQSxTQUFTLENBQUMvQixTQUFWLEdBQXNCZ0MsU0FBdEI7QUFDQUQsSUFBQUEsU0FBUyxDQUFDMUYsU0FBVixDQUFvQkMsR0FBcEIsQ0FBd0IsTUFBeEI7QUFDQVAsSUFBQUEsUUFBUSxDQUFDMkIsY0FBVCxDQUF3QmdDLGFBQWEsQ0FBQyxDQUFELENBQXJDLEVBQTBDL0MsS0FBMUM7QUFDRDtBQUNGOztBQUVELFNBQVN1RixnQkFBVCxDQUEwQmxGLEtBQTFCLEVBQWlDO0FBQy9CQSxFQUFBQSxLQUFLLENBQUNPLGNBQU47QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKiAqKioqIG1vZGFsICoqKioqKiAqL1xuXG5sZXQgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50O1xuXG5mdW5jdGlvbiBvcGVuTW9kYWwoKSB7XG4gIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gIGNvbnN0IG92ZXJsYXkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcub3ZlcmxheScpO1xuICBjb25zdCBpbnRlcmFjdGl2ZUVsZW1lbnRzID0gb3ZlcmxheS5xdWVyeVNlbGVjdG9yQWxsKCdidXR0b24sIGlucHV0LCB0ZXh0YXJlYScpO1xuICBvdmVybGF5LmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdoYXMtb3Blbi1tb2RhbCcpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdHJhcFRhYktleSk7XG4gIC8vIGZvY3VzIHRoZSBmaXJzdCBlbGVtZW50IGluIHRoZSBvdmVybGF5LiB0aW1lb3V0IGlzIG5lZWRlZCBiZWNhdXNlIG9mIENTUyB0cmFuc2l0aW9uXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGludGVyYWN0aXZlRWxlbWVudHNbMF0uZm9jdXMoKTtcbiAgfSwgMTAwKTtcbn1cblxuZnVuY3Rpb24gY2xvc2VNb2RhbCgpIHtcbiAgY2xlYXJGb3JtRXJyb3JzKCk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vdmVybGF5JykuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1vcGVuLW1vZGFsJyk7XG4gIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0cmFwVGFiS2V5KTtcbiAgaWYgKHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCkge1xuICAgIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudC5mb2N1cygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRyYXBUYWJLZXkoZXZlbnQpIHtcbiAgY29uc3Qgb3ZlcmxheSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vdmVybGF5Jyk7XG4gIGNvbnN0IGludGVyYWN0aXZlRWxlbWVudHMgPSBvdmVybGF5LnF1ZXJ5U2VsZWN0b3JBbGwoJ2J1dHRvbiwgaW5wdXQnKTtcbiAgY29uc3QgZmlyc3RFbGVtZW50ID0gaW50ZXJhY3RpdmVFbGVtZW50c1swXTtcbiAgY29uc3QgbGFzdEVsZW1lbnQgPSBpbnRlcmFjdGl2ZUVsZW1lbnRzW2ludGVyYWN0aXZlRWxlbWVudHMubGVuZ3RoIC0gMV07XG4gIGlmIChldmVudC5rZXkgJiYgZXZlbnQua2V5ID09PSAnVGFiJykge1xuICAgIGlmIChldmVudC5zaGlmdEtleSAmJiBldmVudC50YXJnZXQgPT09IGZpcnN0RWxlbWVudCkgeyAvLyBzaGlmdCArIHRhYlxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGxhc3RFbGVtZW50LmZvY3VzKCk7XG4gICAgfSBlbHNlIGlmICghZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQudGFyZ2V0ID09PSBsYXN0RWxlbWVudCkgeyAvLyB0YWJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBmaXJzdEVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqICoqKiogaGFuZGxlIGVycm9ycyAqKioqKiogKi9cblxuZnVuY3Rpb24gc2V0TmFtZUlucHV0RXJyb3IoKSB7XG4gIGNvbnN0IG5hbWVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYW1lJyk7XG4gIGNvbnN0IG5hbWVJbnB1dEVycm9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hbWUtZXJyb3InKTtcbiAgbmFtZUlucHV0LmNsYXNzTGlzdC5hZGQoJ2hhcy1lcnJvcicpO1xuICBuYW1lSW5wdXQuc2V0QXR0cmlidXRlKCdhcmlhLWludmFsaWQnLCAndHJ1ZScpO1xuICBuYW1lSW5wdXQuc2V0QXR0cmlidXRlKCdhcmlhLWRlc2NyaWJlZGJ5JywgJ25hbWUtZXJyb3InKTtcbiAgbmFtZUlucHV0RXJyb3IuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xufVxuXG5mdW5jdGlvbiBjbGVhck5hbWVJbnB1dEVycm9yKCkge1xuICBjb25zdCBuYW1lSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmFtZScpO1xuICBjb25zdCBuYW1lSW5wdXRFcnJvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYW1lLWVycm9yJyk7XG4gIG5hbWVJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKCdoYXMtZXJyb3InKTtcbiAgbmFtZUlucHV0LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1pbnZhbGlkJyk7XG4gIG5hbWVJbnB1dC5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtZGVzY3JpYmVkYnknKTtcbiAgbmFtZUlucHV0RXJyb3IuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xufVxuXG5mdW5jdGlvbiBzZXRSYXRpbmdJbnB1dEVycm9yKCkge1xuICBjb25zdCByYXRpbmdJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYXRpbmcnKTtcbiAgY29uc3QgcmF0aW5nSW5wdXRFcnJvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYXRpbmctZXJyb3InKTtcbiAgcmF0aW5nSW5wdXQuY2xhc3NMaXN0LmFkZCgnaGFzLWVycm9yJyk7XG4gIHJhdGluZ0lucHV0LnNldEF0dHJpYnV0ZSgnYXJpYS1pbnZhbGlkJywgJ3RydWUnKTtcbiAgcmF0aW5nSW5wdXQuc2V0QXR0cmlidXRlKCdhcmlhLWRlc2NyaWJlZGJ5JywgJ3JhdGluZy1lcnJvcicpO1xuICByYXRpbmdJbnB1dEVycm9yLmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbn1cblxuZnVuY3Rpb24gY2xlYXJSYXRpbmdJbnB1dEVycm9yKCkge1xuICBjb25zdCByYXRpbmdJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYXRpbmcnKTtcbiAgY29uc3QgcmF0aW5nSW5wdXRFcnJvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYXRpbmctZXJyb3InKTtcbiAgcmF0aW5nSW5wdXQuY2xhc3NMaXN0LnJlbW92ZSgnaGFzLWVycm9yJyk7XG4gIHJhdGluZ0lucHV0LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1pbnZhbGlkJyk7XG4gIHJhdGluZ0lucHV0LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1kZXNjcmliZWRieScpO1xuICByYXRpbmdJbnB1dEVycm9yLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbn1cblxuZnVuY3Rpb24gc2V0Q29tbWVudElucHV0RXJyb3IoKSB7XG4gIGNvbnN0IGNvbW1lbnRJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb21tZW50cycpO1xuICBjb25zdCBjb21tZW50SW5wdXRFcnJvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb21tZW50cy1lcnJvcicpO1xuICBjb21tZW50SW5wdXQuY2xhc3NMaXN0LmFkZCgnaGFzLWVycm9yJyk7XG4gIGNvbW1lbnRJbnB1dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaW52YWxpZCcsICd0cnVlJyk7XG4gIGNvbW1lbnRJbnB1dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZGVzY3JpYmVkYnknLCAnY29tbWVudHMtZXJyb3InKTtcbiAgY29tbWVudElucHV0RXJyb3IuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xufVxuXG5mdW5jdGlvbiBjbGVhckNvbW1lbnRJbnB1dEVycm9yKCkge1xuICBjb25zdCBjb21tZW50SW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29tbWVudHMnKTtcbiAgY29uc3QgY29tbWVudElucHV0RXJyb3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29tbWVudHMtZXJyb3InKTtcbiAgY29tbWVudElucHV0LmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1lcnJvcicpO1xuICBjb21tZW50SW5wdXQucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWludmFsaWQnKTtcbiAgY29tbWVudElucHV0LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1kZXNjcmliZWRieScpO1xuICBjb21tZW50SW5wdXRFcnJvci5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG59XG5cbmNvbnN0IGVycm9yRnVuY3Rpb25zID0ge1xuICBuYW1lOiB7XG4gICAgc2V0RXJyb3I6IHNldE5hbWVJbnB1dEVycm9yLFxuICAgIGNsZWFyRXJyb3I6IGNsZWFyTmFtZUlucHV0RXJyb3IsXG4gIH0sXG4gIHJhdGluZzoge1xuICAgIHNldEVycm9yOiBzZXRSYXRpbmdJbnB1dEVycm9yLFxuICAgIGNsZWFyRXJyb3I6IGNsZWFyUmF0aW5nSW5wdXRFcnJvcixcbiAgfSxcbiAgY29tbWVudHM6IHtcbiAgICBzZXRFcnJvcjogc2V0Q29tbWVudElucHV0RXJyb3IsXG4gICAgY2xlYXJFcnJvcjogY2xlYXJDb21tZW50SW5wdXRFcnJvcixcbiAgfSxcbn07XG5cbi8qKiAqKioqIHZhbGlkYXRpb24gKioqKioqICovXG5cbmZ1bmN0aW9uIHZhbGlkYXRlSW5wdXQoaWQsIHZhbHVlKSB7XG4gIGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpLmNsb25lTm9kZSgpO1xuICBsZXQgaW5wdXRWYWx1ZTtcbiAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICBpbnB1dFZhbHVlID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgaW5wdXRWYWx1ZSA9IGlucHV0LnZhbHVlO1xuICB9XG4gIGlucHV0VmFsdWUgPSBpZCA9PT0gJ3JhdGluZycgPyBOdW1iZXIucGFyc2VJbnQoaW5wdXRWYWx1ZSwgMTApIDogaW5wdXRWYWx1ZTtcbiAgaWYgKGlucHV0VmFsdWUpIHtcbiAgICBlcnJvckZ1bmN0aW9uc1tpZF0uY2xlYXJFcnJvcigpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShlcnJvckZ1bmN0aW9uc1tpZF0uc2V0RXJyb3IpO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlQWxsSW5wdXRzKCkge1xuICBsZXQgZXJyb3IgPSBmYWxzZTtcbiAgY29uc3QgaW5wdXRJZHMgPSBbJ25hbWUnLCAncmF0aW5nJywgJ2NvbW1lbnRzJ107XG4gIGNvbnN0IGludmFsaWRJbnB1dHMgPSBbXTtcbiAgaW5wdXRJZHMuZm9yRWFjaCgoaWQpID0+IHtcbiAgICBjb25zdCBpbnB1dFZhbGlkID0gdmFsaWRhdGVJbnB1dChpZCk7XG4gICAgaWYgKCFpbnB1dFZhbGlkKSB7XG4gICAgICBpbnZhbGlkSW5wdXRzLnB1c2goaWQpO1xuICAgICAgZXJyb3IgPSB0cnVlO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiB7IGVycm9yLCBpbnZhbGlkSW5wdXRzIH07XG59XG5cbi8qKiAqKioqIGhhbmRsZSBldmVudHMgKioqKioqICovXG5cbmZ1bmN0aW9uIGhhbmRsZVJhbmdlQ2hhbmdlKGV2ZW50KSB7XG4gIGNvbnN0IHJhdGluZ1ZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJhdGluZy12YWx1ZScpO1xuICByYXRpbmdWYWx1ZS5pbm5lckhUTUwgPSBgJHtldmVudC50YXJnZXQudmFsdWV9LjBgO1xuICB2YWxpZGF0ZUlucHV0KGV2ZW50LnRhcmdldC5uYW1lLCBldmVudC50YXJnZXQudmFsdWUpO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVJbnB1dEtleVVwKGV2ZW50KSB7XG4gIGlmICghKGV2ZW50LmtleSAmJiBldmVudC5rZXkgPT09ICdUYWInKSkge1xuICAgIC8vIHdoZW4gdGFiIGlzIHVzZWQsIGFsbG93IHRoZSBvbmJsdXIgaGFuZGxlciB0byBwZXJmb3JtIHZhbGlkYXRpb25cbiAgICAvLyB3aGVuIHRoZSB0YWIga2V5IGlzIHByZXNzZWQsIGZvY3VzIGlzIGFscmVhZHkgb24gdGhlIG5leHQgaW5wdXQgd2hlbiB0aGUgZXZlbnQgZmlyZXNcbiAgICAvLyBzbyB0aGUgd3JvbmcgaW5wdXQgaXMgdmFsaWRhdGVkXG4gICAgdmFsaWRhdGVJbnB1dChldmVudC50YXJnZXQubmFtZSwgZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYW5kbGVJbnB1dEJsdXIoZXZlbnQpIHtcbiAgdmFsaWRhdGVJbnB1dChldmVudC50YXJnZXQubmFtZSwgZXZlbnQudGFyZ2V0LnZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZ2V0Rm9ybUlucHV0VmFsdWVzKCkge1xuICBjb25zdCBpbnB1dElkcyA9IFsnbmFtZScsICdyYXRpbmcnLCAnY29tbWVudHMnXTtcbiAgY29uc3QgdmFsdWVzID0ge307XG4gIGlucHV0SWRzLmZvckVhY2goKGlkKSA9PiB7XG4gICAgdmFsdWVzW2lkXSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKS52YWx1ZTtcbiAgfSk7XG4gIHJldHVybiB2YWx1ZXM7XG59XG5cbmZ1bmN0aW9uIGNsZWFyRm9ybSgpIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hbWUnKS52YWx1ZSA9ICcnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmF0aW5nJykudmFsdWUgPSAnMCc7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yYXRpbmctdmFsdWUnKS5pbm5lckhUTUwgPSAnMC4wJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbW1lbnRzJykudmFsdWUgPSAnJztcbn1cblxuZnVuY3Rpb24gY2xlYXJGb3JtRXJyb3JzKCkge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmFtZS1lcnJvcicpLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhdGluZy1lcnJvcicpLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbW1lbnRzLWVycm9yJykuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1mb3JtLWVycm9yJykuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1mb3JtLWVycm9yJykuaW5uZXJIVE1MID0gJyc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYW1lJykuY2xhc3NMaXN0LnJlbW92ZSgnaGFzLWVycm9yJyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYXRpbmcnKS5jbGFzc0xpc3QucmVtb3ZlKCdoYXMtZXJyb3InKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbW1lbnRzJykuY2xhc3NMaXN0LnJlbW92ZSgnaGFzLWVycm9yJyk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUFkZFJldmlld1N1Ym1pdCgpIHtcbiAgY29uc3QgeyBlcnJvciwgaW52YWxpZElucHV0cyB9ID0gdmFsaWRhdGVBbGxJbnB1dHMoKTtcbiAgaWYgKCFlcnJvcikge1xuICAgIGNvbnN0IHsgbmFtZSwgcmF0aW5nLCBjb21tZW50cyB9ID0gZ2V0Rm9ybUlucHV0VmFsdWVzKCk7XG4gICAgaWYgKCghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHx8ICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuY29udHJvbGxlcikpIHtcbiAgICAgIC8vIHBlcmZvcm0gcmVndWxhciBmZXRjaCBhbmQgcmVndWxhciB1cGRhdGVzXG4gICAgICBjb25zdCBzdWJtaXRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1zdWJtaXQnKTtcbiAgICAgIHN1Ym1pdEJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICBzdWJtaXRCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWJ1c3knLCAndHJ1ZScpO1xuICAgICAgREJIZWxwZXIuYWRkUmV2aWV3KHNlbGYucmVzdGF1cmFudC5pZCwgbmFtZSwgcmF0aW5nLCBjb21tZW50cywgKGVycm9yLCBuZXdSZXZpZXcpID0+IHtcbiAgICAgICAgc3VibWl0QnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgICAgICAgc3VibWl0QnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ2ZhbHNlJyk7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIGVucXVldWVUb2FzdCgnQW4gZXJyb3Igb2NjdXJyZWQuIFBsZWFzZSB0cnkgYWdhaW4nLCAnZXJyb3InKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW5xdWV1ZVRvYXN0KGAke25hbWV9J3MgcmV2aWV3IGhhcyBiZWVuIHNhdmVkYCwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcbiAgICAgICAgICB1bC5pbnNlcnRCZWZvcmUoY3JlYXRlUmV2aWV3SFRNTChuZXdSZXZpZXcpLCB1bC5maXJzdENoaWxkKTtcbiAgICAgICAgICBjbG9zZU1vZGFsKCk7XG4gICAgICAgICAgY2xlYXJGb3JtKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXF1ZXN0SWQgPSBgJHtzZWxmLnJlc3RhdXJhbnQuaWR9LSR7RGF0ZS5ub3coKX1gO1xuICAgICAgY29uc3QgbmV3UmV2aWV3ID0ge1xuICAgICAgICBuYW1lLCByYXRpbmcsIGNvbW1lbnRzLCByZXN0YXVyYW50X2lkOiBzZWxmLnJlc3RhdXJhbnQuaWQsXG4gICAgICB9O1xuICAgICAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gICAgICB1bC5pbnNlcnRCZWZvcmUoY3JlYXRlUmV2aWV3SFRNTChuZXdSZXZpZXcsIHRydWUsIHJlcXVlc3RJZCksIHVsLmZpcnN0Q2hpbGQpO1xuXG4gICAgICBpZiAoKCdvbkxpbmUnIGluIG5hdmlnYXRvcikgJiYgIW5hdmlnYXRvci5vbkxpbmUpIHtcbiAgICAgICAgZW5xdWV1ZVRvYXN0KCdZb3VyIHJldmlldyB3aWxsIGJlIHN1Ym1pdHRlZCB3aGVuIHlvdSBhcmUgYmFjayBvbmxpbmUnKTtcbiAgICAgIH1cblxuICAgICAgY2xvc2VNb2RhbCgpO1xuICAgICAgY2xlYXJGb3JtKCk7XG4gICAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5jb250cm9sbGVyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogJ3Bvc3QtcmV2aWV3JyxcbiAgICAgICAgcmV2aWV3OiBuZXdSZXZpZXcsXG4gICAgICAgIHJlcXVlc3RJZCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfSBlbHNlIHsgLy8gZm9ybSBlcnJvcnMgbm90IGNsZWFyZWRcbiAgICBjb25zdCBmb3JtRXJyb3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1mb3JtLWVycm9yJyk7XG4gICAgY29uc3QgZXJyb3JUZXh0ID0gYEludmFsaWQgaW5wdXQgZm9yOiAke2ludmFsaWRJbnB1dHMuam9pbignLCAnKX1gO1xuICAgIGZvcm1FcnJvci5pbm5lckhUTUwgPSBlcnJvclRleHQ7XG4gICAgZm9ybUVycm9yLmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpbnZhbGlkSW5wdXRzWzBdKS5mb2N1cygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUZvcm1TdWJtaXQoZXZlbnQpIHtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbn1cbiJdLCJmaWxlIjoiYWRkUmV2aWV3TW9kYWwuanMifQ==
