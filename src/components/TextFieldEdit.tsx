import * as mobx from "mobx-react";
import { Field } from "../model/field/Field";
import { FieldLabel } from "./FieldLabel";
import React, { useRef, useState } from "react";

export interface IProps {
  field: Field;
  autoFocus?: boolean;
  hideLabel?: boolean;
  attemptFileChanges?: () => boolean;
  onBlurWithValue?: (currentValue: string) => void;
  // this one will prevent the user from moving on
  validate?: (value: string) => boolean;
  tooltip?: string;
}

export const TextFieldEdit: React.FunctionComponent<
  IProps & React.HTMLAttributes<HTMLDivElement>
> = mobx.observer((props) => {
  const [invalid, setInvalid] = React.useState(false);
  const [previous, setPrevious] = useState(props.field.text);
  const { current: fieldId } = useRef(
    "textfield-" +
      (Math.random().toString(36) + "00000000000000000").slice(2, 7)
  );

  function onChange(event: React.FormEvent<HTMLTextAreaElement>, text: Field) {
    // NB: Don't trim here. It is tempting, because at the end of the day we'd
    // like it trimmed, but if you do it here, it's not possible to even
    // type a space.
    // NO: text.text = event.currentTarget.value.trim();
    text.text = event.currentTarget.value;
    setPrevious(event.currentTarget.value);
    setInvalid(false);
  }

  function getValue(text: Field): string {
    if (text === undefined) {
      return "Null Text";
    }
    return text.text;
  }

  return (
    <div
      className={"field " + (props.className ? props.className : "")}
      title={props.tooltip}
    >
      {props.hideLabel ? (
        ""
      ) : (
        <FieldLabel htmlFor={fieldId} fieldDef={props.field.definition} />
      )}

      <textarea
        id={fieldId}
        tabIndex={props.tabIndex}
        autoFocus={props.autoFocus}
        className={invalid ? "invalid" : ""}
        name={props.field.definition.englishLabel} //what does this do? Maybe accessibility?
        value={getValue(props.field)}
        onChange={(event) => onChange(event, props.field)}
        onKeyDown={(event) => {
          if (!props.field.definition.multipleLines && event.keyCode === 13) {
            event.preventDefault();
          }
        }}
        onBlur={(event: React.FocusEvent<HTMLTextAreaElement>) => {
          const trimmed = event.currentTarget.value.trim();
          // put the trimmed value back into the the html element
          event.currentTarget.value = trimmed;

          if (props.onBlurWithValue) {
            props.onBlurWithValue(trimmed);
          }
          if (props.onBlur) {
            props.onBlur(event as any);
          }
          // Problem: currently the validate() here is showing a message box which messes up the focus (both for it and us)
          // Enhance: we have focus problems (focus is not returned to the field)
          // 1) have the validate return a string instead of show UI
          // 2) a) either show the string in a tooltip, or
          //   b) show the string with the MessageBox but after closing manually re-focus the field
          if (props.validate && !props.validate(trimmed)) {
            event.preventDefault();
            setInvalid(true);
            return false; // cancel leave
          } else {
            setInvalid(false);
            if (props.attemptFileChanges) {
              if (!props.attemptFileChanges()) {
                props.field.text = previous;
              }
            }
            return true;
          }
        }}
      />
    </div>
  );
});
