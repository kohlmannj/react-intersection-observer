/**
 * Returns `false` if all IntersectionObserver and IntersectionObserverEntry
 * features are natively supported
 *
 * @see https://github.com/w3c/IntersectionObserver/blob/b38e62ba74253840800159c4d224dc2f287e1025/polyfill/intersection-observer.js#L14-L31
 */
export function needsPolyfill() {
  return !(
    'IntersectionObserver' in window &&
    'IntersectionObserverEntry' in window &&
    'intersectionRatio' in (window as any).IntersectionObserverEntry.prototype
  )
}
