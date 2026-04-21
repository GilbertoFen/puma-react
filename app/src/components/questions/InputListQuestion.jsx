import React from 'react';
import './Question.css';

/**
 * InputListQuestion
 * Lista de campos de texto (proyectos, experiencias, etc.)
 *
 * Props:
 *   question   {string}   - Texto de la pregunta
 *   fields     {Array}    - Array de { label, key, placeholder }
 *   value      {Object}   - { [key]: string }
 *   onChange   {fn}       - Callback (updatedObject) => void
 *   listLabel  {string}   - Etiqueta para la sección de lista (opcional)
 *   listCount  {number}   - Número de inputs de lista (default 3)
 */
export default function InputListQuestion({
  question,
  fields = [],
  value = {},
  onChange,
  listLabel = 'Proyectos realizados',
  listCount = 3,
}) {
  const updateField = (key, val) => {
    onChange({ ...value, [key]: val });
  };

  const updateList = (idx, val) => {
    const list = value._list || [];
    const newList = [...list];
    newList[idx] = val;
    onChange({ ...value, _list: newList });
  };

  return (
    <div className="question-body">
      <h2 className="question-title">{question}</h2>

      <p className="q-section-label">{listLabel}</p>
      <div className="q-input-list">
        {Array.from({ length: listCount }).map((_, i) => (
          <input
            key={i}
            className="q-input"
            type="text"
            value={(value._list || [])[i] || ''}
            onChange={(e) => updateList(i, e.target.value)}
            placeholder={`${listLabel} ${i + 1}`}
          />
        ))}
      </div>

      {fields.map(({ label, key, placeholder }) => (
        <div key={key} className="q-field">
          <p className="q-section-label">{label}</p>
          <input
            className="q-input"
            type="text"
            value={value[key] || ''}
            onChange={(e) => updateField(key, e.target.value)}
            placeholder={placeholder || label}
          />
        </div>
      ))}
    </div>
  );
}
