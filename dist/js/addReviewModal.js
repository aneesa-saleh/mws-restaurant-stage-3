"use strict";

/****** modal *******/
function openModal() {
  previouslyFocusedElement = document.activeElement;
  var overlay = document.querySelector('.overlay');
  var interactiveElements = overlay.querySelectorAll('button, input, textarea');
  overlay.classList.add('show');
  document.body.classList.add('has-open-modal');
  document.addEventListener('keydown', trapTabKey);
  setTimeout(function () {
    interactiveElements[0].focus();
  }, 100);
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
  var overlay = document.querySelector('.overlay');
  var interactiveElements = overlay.querySelectorAll('button, input');
  var TAB = 9;
  var firstElement = interactiveElements[0];
  var lastElement = interactiveElements[interactiveElements.length - 1];

  if (event.keyCode === TAB) {
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
/****** handle errors *******/


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
/****** validation *******/

function validateInput(id) {
  var input = document.getElementById(id).cloneNode();
  var value = id === 'rating' ? Number.parseInt(input.value, 10) : input.value;

  if (value) {
    errorFunctions[id].clearError();
    return true;
  } else {
    errorFunctions[id].setError();
    return false;
  }
}

function validateAllInputs() {
  var allInputsValid = true;
  var inputIds = ['name', 'rating', 'comments'];
  inputIds.forEach(function (id) {
    var inputValid = validateInput(id);
    allInputsValid = allInputsValid && inputValid;
  });
  return allInputsValid;
}
/****** handle events *******/


function handleRangeChange(event) {
  var ratingValue = document.querySelector('.rating-value');
  ratingValue.innerHTML = "".concat(event.target.value, ".0");
}

function handleNameInputBlur() {
  validateInput('name');
}

function handleRatingInputBlur() {
  validateInput('rating');
}

function handleCommentInputBlur() {
  validateInput('comments');
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

function handleAddReviewSubmit() {
  var allInputsValid = validateAllInputs();

  if (allInputsValid) {
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
          // TODO: toast error
          console.log(error);
        } else {
          // TODO: toast success
          var ul = document.getElementById('reviews-list');
          ul.appendChild(createReviewHTML(newReview));
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
      ul.appendChild(createReviewHTML(newReview, true, requestId));
      closeModal();
      clearForm();
      navigator.serviceWorker.controller.postMessage({
        type: 'post-review',
        review: newReview,
        requestId: requestId
      });
    }
  }
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFkZFJldmlld01vZGFsLmpzIl0sIm5hbWVzIjpbIm9wZW5Nb2RhbCIsInByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCIsImRvY3VtZW50IiwiYWN0aXZlRWxlbWVudCIsIm92ZXJsYXkiLCJxdWVyeVNlbGVjdG9yIiwiaW50ZXJhY3RpdmVFbGVtZW50cyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJjbGFzc0xpc3QiLCJhZGQiLCJib2R5IiwiYWRkRXZlbnRMaXN0ZW5lciIsInRyYXBUYWJLZXkiLCJzZXRUaW1lb3V0IiwiZm9jdXMiLCJjbG9zZU1vZGFsIiwicmVtb3ZlIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImV2ZW50IiwiVEFCIiwiZmlyc3RFbGVtZW50IiwibGFzdEVsZW1lbnQiLCJsZW5ndGgiLCJrZXlDb2RlIiwic2hpZnRLZXkiLCJ0YXJnZXQiLCJwcmV2ZW50RGVmYXVsdCIsInNldE5hbWVJbnB1dEVycm9yIiwibmFtZUlucHV0IiwiZ2V0RWxlbWVudEJ5SWQiLCJuYW1lSW5wdXRFcnJvciIsInNldEF0dHJpYnV0ZSIsImNsZWFyTmFtZUlucHV0RXJyb3IiLCJyZW1vdmVBdHRyaWJ1dGUiLCJzZXRSYXRpbmdJbnB1dEVycm9yIiwicmF0aW5nSW5wdXQiLCJyYXRpbmdJbnB1dEVycm9yIiwiY2xlYXJSYXRpbmdJbnB1dEVycm9yIiwic2V0Q29tbWVudElucHV0RXJyb3IiLCJjb21tZW50SW5wdXQiLCJjb21tZW50SW5wdXRFcnJvciIsImNsZWFyQ29tbWVudElucHV0RXJyb3IiLCJlcnJvckZ1bmN0aW9ucyIsIm5hbWUiLCJzZXRFcnJvciIsImNsZWFyRXJyb3IiLCJyYXRpbmciLCJjb21tZW50cyIsInZhbGlkYXRlSW5wdXQiLCJpZCIsImlucHV0IiwiY2xvbmVOb2RlIiwidmFsdWUiLCJOdW1iZXIiLCJwYXJzZUludCIsInZhbGlkYXRlQWxsSW5wdXRzIiwiYWxsSW5wdXRzVmFsaWQiLCJpbnB1dElkcyIsImZvckVhY2giLCJpbnB1dFZhbGlkIiwiaGFuZGxlUmFuZ2VDaGFuZ2UiLCJyYXRpbmdWYWx1ZSIsImlubmVySFRNTCIsImhhbmRsZU5hbWVJbnB1dEJsdXIiLCJoYW5kbGVSYXRpbmdJbnB1dEJsdXIiLCJoYW5kbGVDb21tZW50SW5wdXRCbHVyIiwiZ2V0Rm9ybUlucHV0VmFsdWVzIiwidmFsdWVzIiwiY2xlYXJGb3JtIiwiaGFuZGxlQWRkUmV2aWV3U3VibWl0IiwibmF2aWdhdG9yIiwic2VydmljZVdvcmtlciIsImNvbnRyb2xsZXIiLCJzdWJtaXRCdXR0b24iLCJEQkhlbHBlciIsImFkZFJldmlldyIsInNlbGYiLCJyZXN0YXVyYW50IiwiZXJyb3IiLCJuZXdSZXZpZXciLCJjb25zb2xlIiwibG9nIiwidWwiLCJhcHBlbmRDaGlsZCIsImNyZWF0ZVJldmlld0hUTUwiLCJyZXF1ZXN0SWQiLCJEYXRlIiwibm93IiwicmVzdGF1cmFudF9pZCIsInBvc3RNZXNzYWdlIiwidHlwZSIsInJldmlldyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUVBLFNBQVNBLFNBQVQsR0FBcUI7QUFDbkJDLEVBQUFBLHdCQUF3QixHQUFHQyxRQUFRLENBQUNDLGFBQXBDO0FBQ0EsTUFBTUMsT0FBTyxHQUFHRixRQUFRLENBQUNHLGFBQVQsQ0FBdUIsVUFBdkIsQ0FBaEI7QUFDQSxNQUFNQyxtQkFBbUIsR0FBR0YsT0FBTyxDQUFDRyxnQkFBUixDQUF5Qix5QkFBekIsQ0FBNUI7QUFDQUgsRUFBQUEsT0FBTyxDQUFDSSxTQUFSLENBQWtCQyxHQUFsQixDQUFzQixNQUF0QjtBQUNBUCxFQUFBQSxRQUFRLENBQUNRLElBQVQsQ0FBY0YsU0FBZCxDQUF3QkMsR0FBeEIsQ0FBNEIsZ0JBQTVCO0FBQ0FQLEVBQUFBLFFBQVEsQ0FBQ1MsZ0JBQVQsQ0FBMEIsU0FBMUIsRUFBcUNDLFVBQXJDO0FBQ0FDLEVBQUFBLFVBQVUsQ0FBQyxZQUFVO0FBQUVQLElBQUFBLG1CQUFtQixDQUFDLENBQUQsQ0FBbkIsQ0FBdUJRLEtBQXZCO0FBQWlDLEdBQTlDLEVBQWdELEdBQWhELENB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WixFQUFrQk0sU0FBbEIsQ0FBL0I7QUFDQXRFLE1BQUFBLFVBQVU7QUFDVnFELE1BQUFBLFNBQVM7QUFDVEUsTUFBQUEsU0FBUyxDQUFDQyxhQUFWLENBQXdCQyxVQUF4QixDQUFtQ2lCLFdBQW5DLENBQStDO0FBQzdDQyxRQUFBQSxJQUFJLEVBQUUsYUFEdUM7QUFFN0NDLFFBQUFBLE1BQU0sRUFBRVosU0FGcUM7QUFHN0NNLFFBQUFBLFNBQVMsRUFBVEE7QUFINkMsT0FBL0M7QUFLRDtBQUNGO0FBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKioqKioqIG1vZGFsICoqKioqKiovXG5cbmZ1bmN0aW9uIG9wZW5Nb2RhbCgpIHtcbiAgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgY29uc3Qgb3ZlcmxheSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vdmVybGF5Jyk7XG4gIGNvbnN0IGludGVyYWN0aXZlRWxlbWVudHMgPSBvdmVybGF5LnF1ZXJ5U2VsZWN0b3JBbGwoJ2J1dHRvbiwgaW5wdXQsIHRleHRhcmVhJyk7XG4gIG92ZXJsYXkuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2hhcy1vcGVuLW1vZGFsJyk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0cmFwVGFiS2V5KTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBpbnRlcmFjdGl2ZUVsZW1lbnRzWzBdLmZvY3VzKCk7IH0sIDEwMCk7XG59XG5cbmZ1bmN0aW9uIGNsb3NlTW9kYWwoKSB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vdmVybGF5JykuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1vcGVuLW1vZGFsJyk7XG4gIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0cmFwVGFiS2V5KTtcbiAgaWYgKHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCkge1xuICAgIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudC5mb2N1cygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRyYXBUYWJLZXkoZXZlbnQpIHtcbiAgY29uc3Qgb3ZlcmxheSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vdmVybGF5Jyk7XG4gIGNvbnN0IGludGVyYWN0aXZlRWxlbWVudHMgPSBvdmVybGF5LnF1ZXJ5U2VsZWN0b3JBbGwoJ2J1dHRvbiwgaW5wdXQnKTtcbiAgY29uc3QgVEFCID0gOTtcbiAgY29uc3QgZmlyc3RFbGVtZW50ID0gaW50ZXJhY3RpdmVFbGVtZW50c1swXTtcbiAgY29uc3QgbGFzdEVsZW1lbnQgPSBpbnRlcmFjdGl2ZUVsZW1lbnRzW2ludGVyYWN0aXZlRWxlbWVudHMubGVuZ3RoIC0gMV07XG4gIGlmIChldmVudC5rZXlDb2RlID09PSBUQUIpIHtcbiAgICBpZiAoZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQudGFyZ2V0ID09PSBmaXJzdEVsZW1lbnQpIHsgLy8gc2hpZnQgKyB0YWJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBsYXN0RWxlbWVudC5mb2N1cygpO1xuICAgIH0gZWxzZSBpZiAoIWV2ZW50LnNoaWZ0S2V5ICYmIGV2ZW50LnRhcmdldCA9PT0gbGFzdEVsZW1lbnQpIHsgLy8gdGFiXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZmlyc3RFbGVtZW50LmZvY3VzKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKioqKiogaGFuZGxlIGVycm9ycyAqKioqKioqL1xuXG5mdW5jdGlvbiBzZXROYW1lSW5wdXRFcnJvcigpIHtcbiAgY29uc3QgbmFtZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hbWUnKTtcbiAgY29uc3QgbmFtZUlucHV0RXJyb3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmFtZS1lcnJvcicpO1xuICBuYW1lSW5wdXQuY2xhc3NMaXN0LmFkZCgnaGFzLWVycm9yJyk7XG4gIG5hbWVJbnB1dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaW52YWxpZCcsICd0cnVlJyk7XG4gIG5hbWVJbnB1dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZGVzY3JpYmVkYnknLCAnbmFtZS1lcnJvcicpO1xuICBuYW1lSW5wdXRFcnJvci5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyTmFtZUlucHV0RXJyb3IoKSB7XG4gIGNvbnN0IG5hbWVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYW1lJyk7XG4gIGNvbnN0IG5hbWVJbnB1dEVycm9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hbWUtZXJyb3InKTtcbiAgbmFtZUlucHV0LmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1lcnJvcicpO1xuICBuYW1lSW5wdXQucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWludmFsaWQnKTtcbiAgbmFtZUlucHV0LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1kZXNjcmliZWRieScpO1xuICBuYW1lSW5wdXRFcnJvci5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG59XG5cbmZ1bmN0aW9uIHNldFJhdGluZ0lucHV0RXJyb3IoKSB7XG4gIGNvbnN0IHJhdGluZ0lucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhdGluZycpO1xuICBjb25zdCByYXRpbmdJbnB1dEVycm9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhdGluZy1lcnJvcicpO1xuICByYXRpbmdJbnB1dC5jbGFzc0xpc3QuYWRkKCdoYXMtZXJyb3InKTtcbiAgcmF0aW5nSW5wdXQuc2V0QXR0cmlidXRlKCdhcmlhLWludmFsaWQnLCAndHJ1ZScpO1xuICByYXRpbmdJbnB1dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZGVzY3JpYmVkYnknLCAncmF0aW5nLWVycm9yJyk7XG4gIHJhdGluZ0lucHV0RXJyb3IuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xufVxuXG5mdW5jdGlvbiBjbGVhclJhdGluZ0lucHV0RXJyb3IoKSB7XG4gIGNvbnN0IHJhdGluZ0lucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhdGluZycpO1xuICBjb25zdCByYXRpbmdJbnB1dEVycm9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhdGluZy1lcnJvcicpO1xuICByYXRpbmdJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKCdoYXMtZXJyb3InKTtcbiAgcmF0aW5nSW5wdXQucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWludmFsaWQnKTtcbiAgcmF0aW5nSW5wdXQucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWRlc2NyaWJlZGJ5Jyk7XG4gIHJhdGluZ0lucHV0RXJyb3IuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xufVxuXG5mdW5jdGlvbiBzZXRDb21tZW50SW5wdXRFcnJvcigpIHtcbiAgY29uc3QgY29tbWVudElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbW1lbnRzJyk7XG4gIGNvbnN0IGNvbW1lbnRJbnB1dEVycm9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbW1lbnRzLWVycm9yJyk7XG4gIGNvbW1lbnRJbnB1dC5jbGFzc0xpc3QuYWRkKCdoYXMtZXJyb3InKTtcbiAgY29tbWVudElucHV0LnNldEF0dHJpYnV0ZSgnYXJpYS1pbnZhbGlkJywgJ3RydWUnKTtcbiAgY29tbWVudElucHV0LnNldEF0dHJpYnV0ZSgnYXJpYS1kZXNjcmliZWRieScsICdjb21tZW50cy1lcnJvcicpO1xuICBjb21tZW50SW5wdXRFcnJvci5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyQ29tbWVudElucHV0RXJyb3IoKSB7XG4gIGNvbnN0IGNvbW1lbnRJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb21tZW50cycpO1xuICBjb25zdCBjb21tZW50SW5wdXRFcnJvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb21tZW50cy1lcnJvcicpO1xuICBjb21tZW50SW5wdXQuY2xhc3NMaXN0LnJlbW92ZSgnaGFzLWVycm9yJyk7XG4gIGNvbW1lbnRJbnB1dC5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtaW52YWxpZCcpO1xuICBjb21tZW50SW5wdXQucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWRlc2NyaWJlZGJ5Jyk7XG4gIGNvbW1lbnRJbnB1dEVycm9yLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbn1cblxuY29uc3QgZXJyb3JGdW5jdGlvbnMgPSB7XG4gIG5hbWU6IHtcbiAgICBzZXRFcnJvcjogc2V0TmFtZUlucHV0RXJyb3IsXG4gICAgY2xlYXJFcnJvcjogY2xlYXJOYW1lSW5wdXRFcnJvcixcbiAgfSxcbiAgcmF0aW5nOiB7XG4gICAgc2V0RXJyb3I6IHNldFJhdGluZ0lucHV0RXJyb3IsXG4gICAgY2xlYXJFcnJvcjogY2xlYXJSYXRpbmdJbnB1dEVycm9yLFxuICB9LFxuICBjb21tZW50czoge1xuICAgIHNldEVycm9yOiBzZXRDb21tZW50SW5wdXRFcnJvcixcbiAgICBjbGVhckVycm9yOiBjbGVhckNvbW1lbnRJbnB1dEVycm9yLFxuICB9XG59O1xuXG4vKioqKioqIHZhbGlkYXRpb24gKioqKioqKi9cblxuZnVuY3Rpb24gdmFsaWRhdGVJbnB1dChpZCkge1xuICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKS5jbG9uZU5vZGUoKTtcbiAgY29uc3QgdmFsdWUgPSBpZCA9PT0gJ3JhdGluZyc/IE51bWJlci5wYXJzZUludChpbnB1dC52YWx1ZSwgMTApIDogaW5wdXQudmFsdWU7XG4gIGlmICh2YWx1ZSkge1xuICAgIGVycm9yRnVuY3Rpb25zW2lkXS5jbGVhckVycm9yKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgZXJyb3JGdW5jdGlvbnNbaWRdLnNldEVycm9yKCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlQWxsSW5wdXRzKCkge1xuICBsZXQgYWxsSW5wdXRzVmFsaWQgPSB0cnVlO1xuICBjb25zdCBpbnB1dElkcyA9IFsnbmFtZScsICdyYXRpbmcnLCAnY29tbWVudHMnXTtcbiAgaW5wdXRJZHMuZm9yRWFjaCgoaWQpID0+IHtcbiAgICBjb25zdCBpbnB1dFZhbGlkID0gdmFsaWRhdGVJbnB1dChpZCk7XG4gICAgYWxsSW5wdXRzVmFsaWQgPSBhbGxJbnB1dHNWYWxpZCAmJiBpbnB1dFZhbGlkO1xuICB9KTtcbiAgcmV0dXJuIGFsbElucHV0c1ZhbGlkO1xufVxuXG4vKioqKioqIGhhbmRsZSBldmVudHMgKioqKioqKi9cblxuZnVuY3Rpb24gaGFuZGxlUmFuZ2VDaGFuZ2UoZXZlbnQpIHtcbiAgdmFyIHJhdGluZ1ZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJhdGluZy12YWx1ZScpO1xuICByYXRpbmdWYWx1ZS5pbm5lckhUTUwgPSBgJHtldmVudC50YXJnZXQudmFsdWV9LjBgO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVOYW1lSW5wdXRCbHVyKCkge1xuICB2YWxpZGF0ZUlucHV0KCduYW1lJyk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVJhdGluZ0lucHV0Qmx1cigpIHtcbiAgdmFsaWRhdGVJbnB1dCgncmF0aW5nJyk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUNvbW1lbnRJbnB1dEJsdXIoKSB7XG4gIHZhbGlkYXRlSW5wdXQoJ2NvbW1lbnRzJyk7XG59XG5cbmZ1bmN0aW9uIGdldEZvcm1JbnB1dFZhbHVlcygpIHtcbiAgY29uc3QgaW5wdXRJZHMgPSBbJ25hbWUnLCAncmF0aW5nJywgJ2NvbW1lbnRzJ107XG4gIGNvbnN0IHZhbHVlcyA9IHt9O1xuICBpbnB1dElkcy5mb3JFYWNoKChpZCkgPT4ge1xuICAgIHZhbHVlc1tpZF0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkudmFsdWU7XG4gIH0pO1xuICByZXR1cm4gdmFsdWVzO1xufVxuXG5mdW5jdGlvbiBjbGVhckZvcm0oKSB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYW1lJykudmFsdWUgPSAnJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhdGluZycpLnZhbHVlID0gJzAnO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmF0aW5nLXZhbHVlJykuaW5uZXJIVE1MID0gJzAuMCc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb21tZW50cycpLnZhbHVlID0gJyc7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUFkZFJldmlld1N1Ym1pdCgpIHtcbiAgY29uc3QgYWxsSW5wdXRzVmFsaWQgPSB2YWxpZGF0ZUFsbElucHV0cygpO1xuICBpZiAoYWxsSW5wdXRzVmFsaWQpIHtcbiAgICBjb25zdCB7IG5hbWUsIHJhdGluZywgY29tbWVudHMgfSA9IGdldEZvcm1JbnB1dFZhbHVlcygpO1xuICAgIGlmICgoIW5hdmlnYXRvci5zZXJ2aWNlV29ya2VyKSB8fCAoIW5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLmNvbnRyb2xsZXIpKSB7IC8vIHBlcmZvcm0gcmVndWxhciBmZXRjaCBhbmQgcmVndWxhciB1cGRhdGVzXG4gICAgICBjb25zdCBzdWJtaXRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXJldmlldy1zdWJtaXQnKTtcbiAgICAgIHN1Ym1pdEJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICBzdWJtaXRCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWJ1c3knLCAndHJ1ZScpO1xuICAgICAgREJIZWxwZXIuYWRkUmV2aWV3KHNlbGYucmVzdGF1cmFudC5pZCwgbmFtZSwgcmF0aW5nLCBjb21tZW50cywgKGVycm9yLCBuZXdSZXZpZXcpID0+IHtcbiAgICAgICAgc3VibWl0QnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgICAgICAgc3VibWl0QnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1idXN5JywgJ2ZhbHNlJyk7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIC8vIFRPRE86IHRvYXN0IGVycm9yXG4gICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFRPRE86IHRvYXN0IHN1Y2Nlc3NcbiAgICAgICAgICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcbiAgICAgICAgICB1bC5hcHBlbmRDaGlsZChjcmVhdGVSZXZpZXdIVE1MKG5ld1JldmlldykpO1xuICAgICAgICAgIGNsb3NlTW9kYWwoKTtcbiAgICAgICAgICBjbGVhckZvcm0oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlcXVlc3RJZCA9IGAke3NlbGYucmVzdGF1cmFudC5pZH0tJHtEYXRlLm5vdygpfWA7XG4gICAgICBjb25zdCBuZXdSZXZpZXcgPSB7IG5hbWUsIHJhdGluZywgY29tbWVudHMsIHJlc3RhdXJhbnRfaWQ6IHNlbGYucmVzdGF1cmFudC5pZCB9O1xuICAgICAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gICAgICB1bC5hcHBlbmRDaGlsZChjcmVhdGVSZXZpZXdIVE1MKG5ld1JldmlldywgdHJ1ZSwgcmVxdWVzdElkKSk7XG4gICAgICBjbG9zZU1vZGFsKCk7XG4gICAgICBjbGVhckZvcm0oKTtcbiAgICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLmNvbnRyb2xsZXIucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiAncG9zdC1yZXZpZXcnLFxuICAgICAgICByZXZpZXc6IG5ld1JldmlldyxcbiAgICAgICAgcmVxdWVzdElkLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iXSwiZmlsZSI6ImFkZFJldmlld01vZGFsLmpzIn0=
