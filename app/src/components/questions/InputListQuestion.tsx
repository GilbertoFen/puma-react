import React from 'react';
import './Question.css';

interface Field {
  label: string;
  key: string;
  placeholder?: string;
}

interface InputListQuestionProps {
  question: string;
  fields?: Field[];
  value?: Record<string, any>;
  onChange: (val: Record<string, any>) => void;
  listLabel?: string;
}

export default function InputListQuestion({
  question,
  fields = [],
  value = {},
  onChange,
  listLabel = 'Proyectos realizados',
}: InputListQuestionProps) {
  
  const list = value._list || ['']; // Iniciamos con un campo vacío

  const updateList = (idx: number, val: string) => {
    const newList = [...list];
    newList[idx] = val;
    onChange({ ...value, _list: newList });
  };
  const updateField = (key: string, val: string) => {
    onChange({ ...value, [key]: val });
  };

  const addField = () => {
    onChange({ ...value, _list: [...list, ''] });
  };

  const removeField = (idx: number) => {
    if (list.length > 1) {
      const newList = list.filter((_: any, i: number) => i !== idx);
      onChange({ ...value, _list: newList });
    }
  };

  return (
    <div className="question-body">
      <h2 className="question-title">{question}</h2>
      <p className="q-section-label">{listLabel}</p>
      
      <div className="q-dynamic-list">
        {list.map((item: string, i: number) => (
          <div key={i} className="q-input-group" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              className="q-input"
              type="text"
              value={item}
              onChange={(e) => updateList(i, e.target.value)}
              placeholder={`${listLabel} ${i + 1}`}
              style={{ flex: 1 }}
            />
            {list.length > 1 && (
              <button 
                type="button" 
                onClick={() => removeField(i)}
                className="q-btn-remove"
                style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px', padding: '0 15px' }}
              > - </button>
            )}
          </div>
        ))}
        <button 
          type="button" 
          onClick={addField}
          className="q-btn-add"
        > + Agregar otro proyecto </button>
      </div>

      {fields.map(({ label, key, placeholder }) => (
        <div key={key} className="q-field" style={{ marginTop: '20px' }}>
          <p className="q-section-label">{label}</p>
          <input
            className="q-input"
            type="text"
            value={value[key] || ''}
            onChange={(e) => updateField(key, e.target.value)} // Asumiendo que mantienes updateField
            placeholder={placeholder || label}
          />
        </div>
      ))}
    </div>
  );
}