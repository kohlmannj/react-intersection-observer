import invariant from 'invariant'
import React, { createRef, Fragment, ReactNode, RefObject } from 'react'
import { observe, unobserve } from './intersection'
import { needsPolyfill } from './needs-polyfill'

export interface IntersectionObserverRenderProps {
  inView: boolean
  forwardedRef: RefObject<any>
}

export type IntersectionObserverRenderFunction = (
  renderProps: IntersectionObserverRenderProps,
) => ReactNode

export interface IntersectionObserverProps {
  /** Children expects a function that receives an object contain an `inView` boolean and `ref` that should be assigned to the element root. */
  children?: IntersectionObserverRenderFunction | ReactNode
  forwardedRef: RefObject<any>
  /** Number between 0 and 1 indicating the the percentage that should be visible before triggering. Can also be an array of numbers, to create multiple trigger points. */
  threshold?: number
  /** Only trigger the inView callback once */
  triggerOnce: boolean
  /** The HTMLElement that is used as the viewport for checking visibility of the target. Defaults to the browser viewport if not specified or if null. */
  root?: HTMLElement
  /** Margin around the root. Can have values similar to the CSS margin property, e.g. "10px 20px 30px 40px" (top, right, bottom, left). */
  rootMargin?: string
  /**
   * Unique identifier for the root element - This is used to identify the IntersectionObserver instance, so it can be reused.
   * If you defined a root element, without adding an id, it will create a new instance for all components.
   */
  rootId?: string
  /** Call this function whenever the in view state changes */
  onChange?: (inView: boolean) => void
  /** Whether or not to dynamically `import()` the intersection-observer polyfill if needed */
  importPolyfill?: boolean
}

export interface IntersectionObserverState {
  inView: boolean
  intersectionObserverReady: boolean | undefined
}

/**
 * Monitors scroll, and triggers the children function with updated props
 *
 * <Observer>
 * {({inView, forwardedRef}) => (
 *   <h1 ref={forwardedRef}>{`${inView}`}</h1>
 * )}
 * </Observer>
 */
class Observer extends React.Component<
  IntersectionObserverProps,
  IntersectionObserverState
> {
  public static defaultProps = {
    forwardedRef: createRef<any>(),
    importPolyfill: false,
    threshold: 0,
    triggerOnce: false,
  }

  public state = {
    inView: false,
    intersectionObserverReady: undefined,
  }

  public async componentDidMount() {
    if (process.env.NODE_ENV !== 'production') {
      invariant(
        this.props.forwardedRef
          ? this.props.forwardedRef.current
          : this.props.forwardedRef,
        `react-intersection-observer: No DOM node found. Make sure you forward "ref" to the root DOM element you want to observe.`,
      )
    }

    await this.importIntersectionObserverPolyfill()

    if (this.props.forwardedRef.current) {
      this.observeNode()
    }
  }

  public async componentDidUpdate(
    prevProps: IntersectionObserverProps,
    prevState: IntersectionObserverState,
  ) {
    await this.importIntersectionObserverPolyfill()

    // If a IntersectionObserver option changed, reinit the observer
    if (
      prevProps.rootMargin !== this.props.rootMargin ||
      prevProps.forwardedRef.current !== this.props.forwardedRef.current ||
      prevProps.threshold !== this.props.threshold
    ) {
      unobserve(this.props.forwardedRef.current)
      this.observeNode()
    }

    if (prevState.inView !== this.state.inView) {
      if (this.state.inView && this.props.triggerOnce) {
        unobserve(this.props.forwardedRef.current)
      }
    }
  }

  public componentWillUnmount() {
    if (this.props.forwardedRef.current) {
      unobserve(this.props.forwardedRef.current)
    }
  }

  public observeNode() {
    if (!this.props.forwardedRef.current) {
      return
    }
    const { threshold, root, rootMargin, rootId } = this.props
    observe(
      this.props.forwardedRef.current,
      this.handleChange,
      {
        threshold,
        root,
        rootMargin,
      },
      rootId,
    )
  }

  public handleChange = (inView: boolean) => {
    this.setState({ inView })
    if (this.props.onChange) {
      this.props.onChange(inView)
    }
  }

  public render() {
    const { children, forwardedRef } = this.props
    const { inView } = this.state

    if (typeof children === 'function') {
      // Work around a breaking change in TypeScript function narrowing with a type cast
      /** @see https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#narrowing-functions-now-intersects--object-and-unconstrained-generic-type-parameters */
      return (children as IntersectionObserverRenderFunction)({
        inView,
        forwardedRef,
      })
    }

    return <Fragment>{children}</Fragment>
  }

  private async importIntersectionObserverPolyfill() {
    if (this.state.intersectionObserverReady) {
      return
    }

    if (needsPolyfill() && this.props.importPolyfill) {
      console.log('dynamically import()ing intersection-observer...')
      debugger
      await import('intersection-observer') // tslint:disable-line no-implicit-dependencies
    }

    this.setState({ intersectionObserverReady: true })
  }
}

export default Observer
