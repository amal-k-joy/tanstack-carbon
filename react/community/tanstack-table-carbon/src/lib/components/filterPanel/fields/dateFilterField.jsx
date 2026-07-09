import React from 'react';
import PropTypes from 'prop-types';
import { DatePicker, DatePickerInput, Layer } from '@carbon/react';
import { STANDARD_SIZE_MAP } from '../../../constants/constants';
import { derivePlaceholderFromDateFormat } from '../../../utils/dateFormatHelpers';

const DateFilterField = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  error,
  size = 'md',
  placeholder,
  dateFormat,
  stopPropagation = false,
}) => {
  const resolvedPlaceholder = derivePlaceholderFromDateFormat(placeholder, dateFormat);

  const content = (
    <Layer level={1}>
      <DatePicker
        datePickerType="single"
        value={value || ''}
        onChange={(dates) => {
          onChange(dates?.[0] || null);
        }}
        disabled={disabled}
        {...(dateFormat !== undefined && { dateFormat })}
      >
        <DatePickerInput
          id={id}
          placeholder={resolvedPlaceholder}
          labelText={label}
          size={STANDARD_SIZE_MAP[size]}
          invalid={!!error}
          invalidText={error}
        />
      </DatePicker>
    </Layer>
  );

  if (!stopPropagation) {
    return content;
  }

  return <div onClick={(e) => e.stopPropagation()}>{content}</div>;
};

DateFilterField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  size: PropTypes.string,
  placeholder: PropTypes.string,
  dateFormat: PropTypes.string,
  stopPropagation: PropTypes.bool,
};

export default DateFilterField;
