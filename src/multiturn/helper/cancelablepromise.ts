import PromiseHolder from './promiseholder';
export const CancelToken = Symbol();

export default interface CancelablePromise<T> extends Promise<T> {
  cancel: () => void;
}

export function cancelableResolve<T>(t: T): CancelablePromise<T>;
export function cancelableResolve<T>(): CancelablePromise<void>;

export function cancelableResolve<T>(t?: T): CancelablePromise<void | T> {
  if (t) {
    return cancelable(Promise.resolve(t), () => {
      return;
    });
  }
  else {
    return cancelable(Promise.resolve(), () => {
      return;
    });
  }
}

export function cancelableReject<T>(t: T): CancelablePromise<T>;
export function cancelableReject<T>(): CancelablePromise<void>;

export function cancelableReject<T>(t?: T): CancelablePromise<void | T> {
  if (t) {
    return cancelable(Promise.reject(t), () => {
      return;
    });
  }
  else {
    return cancelable(Promise.reject(), () => {
      return;
    });
  }
}

export function cancelable<T>(oldPromise: Promise<T>,
    reject: (reason?: any) => void): CancelablePromise<T> {
  const promise: Partial<CancelablePromise<T>> = oldPromise;
  promise.cancel = () => {
    reject(CancelToken);
  };
  return promise as CancelablePromise<T>;
}

export function cancelablePromise<T>(callback?:
    (resolve: (t: T) => void, reject: () => void) => void) {
  const holder = new PromiseHolder<T>(callback);
  return holder.promise;
}

export function cancelableThen<T, S>(oldPromise: CancelablePromise<T>,
    continuation: (res: T) => S): CancelablePromise<S> {
  return cancelable(oldPromise.then(continuation),
    oldPromise.cancel.bind(oldPromise));
}

export function timeout<T>(oldPromise: CancelablePromise<T>,
    timeoutMillis: number): CancelablePromise<T | undefined> {
  const newPromise = new PromiseHolder<T | undefined>();
  oldPromise.then((t: T) => newPromise.resolve(t));
  if (timeoutMillis >= 0) {
    setTimeout(() => newPromise.resolve(undefined), timeoutMillis);
  }
  return newPromise.promise;
}
