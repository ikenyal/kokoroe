"use client";

import { useEffect, useRef } from "react";

/**
 * Hidden timing fields for the 実地テスト: when this form appeared (shownAt) and when it was submitted (submitAt).
 * The server computes durations and keeps them only in field-test mode. Times are local clock ms; only differences are used.
 */
export function TimedFields() {
  const shown = useRef<HTMLInputElement>(null);
  const submit = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (shown.current) shown.current.value = String(Date.now());
    const form = shown.current?.form;
    const onSubmit = () => {
      if (submit.current) submit.current.value = String(Date.now());
    };
    form?.addEventListener("submit", onSubmit, { capture: true });
    // Buttons with name/value submit the form too; stamp on click as well (fires before submit).
    form?.addEventListener("click", onSubmit, { capture: true });
    return () => {
      form?.removeEventListener("submit", onSubmit, { capture: true });
      form?.removeEventListener("click", onSubmit, { capture: true });
    };
  }, []);
  return (
    <>
      <input ref={shown} type="hidden" name="shownAt" />
      <input ref={submit} type="hidden" name="submitAt" />
    </>
  );
}
