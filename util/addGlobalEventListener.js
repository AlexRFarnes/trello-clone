export default function addGlobalEventListener(type, selector, callbck) {
  document.addEventListener(type, e => {
    if (e.target.matches(selector)) callbck(e);
  });
}
