"use strict";

var toastTimer = null;
var pendingToasts = [];

function clearToastTimer() {
  clearTimeout(toastTimer);
  toastTimer = null;
}

function enqueueToast(message, type) {
  // add the toast to the beginning of the array
  pendingToasts.unshift({
    message: message,
    type: type
  });

  if (toastTimer === null) {
    // no toast is currently showing
    showToast();
  }
}

function hideToast() {
  clearTimeout(toastTimer);
  toastTimer = null;
  var toast = document.getElementById('toast');
  var toastText = document.getElementById('toast-text');
  toast.classList.remove('show');
  setTimeout(function () {
    toastText.setAttribute('aria-live', 'polite'); // show the next toast if there is any pending

    showToast();
  }, 0);
}

function showToast() {
  var toast = pendingToasts.pop();
  if (!toast || !toast.message) return;
  var message = toast.message,
      type = toast.type;
  var toastElement = document.getElementById('toast');
  var toastText = document.getElementById('toast-text');
  var toastIcon = document.getElementById('toast-icon');
  toastText.setAttribute('aria-live', 'polite');
  toastText.innerHTML = message;

  if (type === 'error') {
    toastElement.className = 'toast show error';
  } else if (type === 'success') {
    toastElement.className = 'toast show success';
  } else {
    toastElement.className = 'toast show';
  }

  clearTimeout(toastTimer);
  setTimeout(function () {
    toastText.setAttribute('aria-live', 'off');
  }, 0);
  toastTimer = setTimeout(hideToast, 10000);
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRvYXN0cy5qcyJdLCJuYW1lcyI6WyJ0b2FzdFRpbWVyIiwicGVuZGluZ1RvYXN0cyIsImNsZWFyVG9hc3RUaW1lciIsImNsZWFyVGltZW91dCIsImVucXVldWVUb2FzdCIsIm1lc3NhZ2UiLCJ0eXBlIiwidW5zaGlmdCIsInNob3dUb2FzdCIsImhpZGVUb2FzdCIsInRvYXN0IiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsInRvYXN0VGV4dCIsImNsYXNzTGlzdCIsInJlbW92ZSIsInNldFRpbWVvdXQiLCJzZXRBdHRyaWJ1dGUiLCJwb3AiLCJ0b2FzdEVsZW1lbnQiLCJ0b2FzdEljb24iLCJpbm5lckhUTUwiLCJjbGFzc05hbWUiXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBSUEsVUFBVSxHQUFHLElBQWpCO0FBQ0EsSUFBTUMsYUFBYSxHQUFHLEVBQXRCOztBQUVBLFNBQVNDLGVBQVQsR0FBMkI7QUFDekJDLEVBQUFBLFlBQVksQ0FBQ0gsVUFBRCxDQUFaO0FBQ0FBLEVBQUFBLFVBQVUsR0FBRyxJQUFiO0FBQ0Q7O0FBRUQsU0FBU0ksWUFBVCxDQUFzQkMsT0FBdEIsRUFBK0JDLElBQS9CLEVBQXFDO0FBQ25DO0FBQ0FMLEVBQUFBLGFBQWEsQ0FBQ00sT0FBZCxDQUFzQjtBQUFFRixJQUFBQSxPQUFPLEVBQVBBLE9BQUY7QUFBV0MsSUFBQUEsSUFBSSxFQUFKQTtBQUFYLEdBQXRCOztBQUNBLE1BQUlOLFVBQVUsS0FBSyxJQUFuQixFQUF5QjtBQUFFO0FBQ3pCUSxJQUFBQSxTQUFTO0FBQ1Y7QUFDRjs7QUFFRCxTQUFTQyxTQUFULEdBQXFCO0FBQ25CTixFQUFBQSxZQUFZLENBQUNILFVBQUQsQ0FBWjtBQUNBQSxFQUFBQSxVQUFVLEdBQUcsSUFBYjtBQUNBLE1BQU1VLEtBQUssR0FBR0MsUUFBUSxDQUFDQyxjQUFULENBQXdCLE9BQXhCLENBQWQ7QUFDQSxNQUFNQyxTQUFTLEdBQUdGLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixZQUF4QixDQUFsQjtBQUNBRixFQUFBQSxLQUFLLENBQUNJLFNBQU4sQ0FBZ0JDLE1BQWhCLENBQXVCLE1BQXZCO0FBQ0FDLEVBQUFBLFVBQVUsQ0FBQyxZQUFNO0FBQ2ZILElBQUFBLFNBQVMsQ0FBQ0ksWUFBVixDQUF1QixXQUF2QixFQUFvQyxRQUFwQyxFQURlLENBRWY7O0FBQ0FULElBQUFBLFNBQVM7QUFDVixHQUpTLEVBSVAsQ0FKTyxDQUFWO0FBS0Q7O0FBRUQsU0FBU0EsU0FBVCxHQUFxQjtBQUNuQixNQUFNRSxLQUFLLEdBQUdULGFBQWEsQ0FBQ2lCLEdBQWQsRUFBZDtBQUNBLE1BQUksQ0FBQ1IsS0FBRCxJQUFVLENBQUNBLEtBQUssQ0FBQ0wsT0FBckIsRUFBOEI7QUFGWCxNQUlYQSxPQUpXLEdBSU9LLEtBSlAsQ0FJWEwsT0FKVztBQUFBLE1BSUZDLElBSkUsR0FJT0ksS0FKUCxDQUlGSixJQUpFO0FBS25CLE1BQU1hLFlBQVksR0FBR1IsUUFBUSxDQUFDQyxjQUFULENBQXdCLE9BQXhCLENBQXJCO0FBQ0EsTUFBTUMsU0FBUyxHQUFHRixRQUFRLENBQUNDLGNBQVQsQ0FBd0IsWUFBeEIsQ0FBbEI7QUFDQSxNQUFNUSxTQUFTLEdBQUdULFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixZQUF4QixDQUFsQjtBQUVBQyxFQUFBQSxTQUFTLENBQUNJLFlBQVYsQ0FBdUIsV0FBdkIsRUFBb0MsUUFBcEM7QUFDQUosRUFBQUEsU0FBUyxDQUFDUSxTQUFWLEdBQXNCaEIsT0FBdEI7O0FBRUEsTUFBSUMsSUFBSSxLQUFLLE9BQWIsRUFBc0I7QUFDcEJhLElBQUFBLFlBQVksQ0FBQ0csU0FBYixHQUF5QixrQkFBekI7QUFDRCxHQUZELE1BRU8sSUFBSWhCLElBQUksS0FBSyxTQUFiLEVBQXdCO0FBQzdCYSxJQUFBQSxZQUFZLENBQUNHLFNBQWIsR0FBeUIsb0JBQXpCO0FBQ0QsR0FGTSxNQUVBO0FBQ0xILElBQUFBLFlBQVksQ0FBQ0csU0FBYixHQUF5QixZQUF6QjtBQUNEOztBQUVEbkIsRUFBQUEsWUFBWSxDQUFDSCxVQUFELENBQVo7QUFDQWdCLEVBQUFBLFVBQVUsQ0FBQyxZQUFNO0FBQ2ZILElBQUFBLFNBQVMsQ0FBQ0ksWUFBVixDQUF1QixXQUF2QixFQUFvQyxLQUFwQztBQUNELEdBRlMsRUFFUCxDQUZPLENBQVY7QUFHQWpCLEVBQUFBLFVBQVUsR0FBR2dCLFVBQVUsQ0FBQ1AsU0FBRCxFQUFZLEtBQVosQ0FBdkI7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImxldCB0b2FzdFRpbWVyID0gbnVsbDtcbmNvbnN0IHBlbmRpbmdUb2FzdHMgPSBbXTtcblxuZnVuY3Rpb24gY2xlYXJUb2FzdFRpbWVyKCkge1xuICBjbGVhclRpbWVvdXQodG9hc3RUaW1lcik7XG4gIHRvYXN0VGltZXIgPSBudWxsO1xufVxuXG5mdW5jdGlvbiBlbnF1ZXVlVG9hc3QobWVzc2FnZSwgdHlwZSkge1xuICAvLyBhZGQgdGhlIHRvYXN0IHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5XG4gIHBlbmRpbmdUb2FzdHMudW5zaGlmdCh7IG1lc3NhZ2UsIHR5cGUgfSk7XG4gIGlmICh0b2FzdFRpbWVyID09PSBudWxsKSB7IC8vIG5vIHRvYXN0IGlzIGN1cnJlbnRseSBzaG93aW5nXG4gICAgc2hvd1RvYXN0KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaGlkZVRvYXN0KCkge1xuICBjbGVhclRpbWVvdXQodG9hc3RUaW1lcik7XG4gIHRvYXN0VGltZXIgPSBudWxsO1xuICBjb25zdCB0b2FzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdCcpO1xuICBjb25zdCB0b2FzdFRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3QtdGV4dCcpO1xuICB0b2FzdC5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHRvYXN0VGV4dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGl2ZScsICdwb2xpdGUnKTtcbiAgICAvLyBzaG93IHRoZSBuZXh0IHRvYXN0IGlmIHRoZXJlIGlzIGFueSBwZW5kaW5nXG4gICAgc2hvd1RvYXN0KCk7XG4gIH0sIDApO1xufVxuXG5mdW5jdGlvbiBzaG93VG9hc3QoKSB7XG4gIGNvbnN0IHRvYXN0ID0gcGVuZGluZ1RvYXN0cy5wb3AoKTtcbiAgaWYgKCF0b2FzdCB8fCAhdG9hc3QubWVzc2FnZSkgcmV0dXJuO1xuXG4gIGNvbnN0IHsgbWVzc2FnZSwgdHlwZSB9ID0gdG9hc3Q7XG4gIGNvbnN0IHRvYXN0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdCcpO1xuICBjb25zdCB0b2FzdFRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3QtdGV4dCcpO1xuICBjb25zdCB0b2FzdEljb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3QtaWNvbicpO1xuXG4gIHRvYXN0VGV4dC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGl2ZScsICdwb2xpdGUnKTtcbiAgdG9hc3RUZXh0LmlubmVySFRNTCA9IG1lc3NhZ2U7XG5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICB0b2FzdEVsZW1lbnQuY2xhc3NOYW1lID0gJ3RvYXN0IHNob3cgZXJyb3InO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdWNjZXNzJykge1xuICAgIHRvYXN0RWxlbWVudC5jbGFzc05hbWUgPSAndG9hc3Qgc2hvdyBzdWNjZXNzJztcbiAgfSBlbHNlIHtcbiAgICB0b2FzdEVsZW1lbnQuY2xhc3NOYW1lID0gJ3RvYXN0IHNob3cnO1xuICB9XG5cbiAgY2xlYXJUaW1lb3V0KHRvYXN0VGltZXIpO1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICB0b2FzdFRleHQuc2V0QXR0cmlidXRlKCdhcmlhLWxpdmUnLCAnb2ZmJyk7XG4gIH0sIDApO1xuICB0b2FzdFRpbWVyID0gc2V0VGltZW91dChoaWRlVG9hc3QsIDEwMDAwKTtcbn1cbiJdLCJmaWxlIjoidG9hc3RzLmpzIn0=
