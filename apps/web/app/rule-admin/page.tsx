'use client';

import React, { useEffect, useState } from 'react';

interface IRule {
  id: number;
  topic: string;
  position: string;
  question: string;
  answer: string;
  horizontal_prompts: string[];
  vertical_prompts: string[];
}

const RuleAdminPageComponent: React.FC = () => {
  const [rules, setRules] = useState<IRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShowModal, setIsShowModal] = useState(false);
  const [modalRule, setModalRule] = useState<IRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/rules')
      .then(res => res.json())
      .then(data => {
        setRules(data.rules || []);
        setIsLoading(false);
      })
      .catch(() => {
        setError('Failed to load rules');
        setIsLoading(false);
      });
  }, []);

  const handleEdit = (rule: IRule) => {
    setModalRule(rule);
    setIsShowModal(true);
  };

  const handleSave = async (updatedRule: IRule) => {
    setIsSaving(true);
    try {
      const newRules = rules.map(r => r.id === updatedRule.id ? updatedRule : r);
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: newRules }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setRules(newRules);
      setIsShowModal(false);
    } catch (e) {
      alert('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] w-full max-w-screen-lg mx-auto bg-white rounded-2xl shadow border border-gray-200 p-2 sm:p-6 relative">
      <h1 className="text-lg sm:text-2xl font-bold mb-6 text-black">Rule-based Knowledge Management</h1>
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="flex-1 overflow-auto">
        <table className="w-full border text-sm rounded-xl shadow-sm overflow-x-auto min-w-[700px]">
          <thead className="sticky top-0 z-10 bg-gray-100">
            <tr>
              <th className="border px-3 py-2 whitespace-nowrap font-semibold text-gray-900">ID</th>
              <th className="border px-3 py-2 whitespace-nowrap font-semibold text-gray-900">Position</th>
              <th className="border px-3 py-2 whitespace-nowrap font-semibold text-gray-900">Question</th>
              <th className="border px-3 py-2 whitespace-nowrap font-semibold text-gray-900">Horizontal IDs</th>
              <th className="border px-3 py-2 whitespace-nowrap font-semibold text-gray-900">Vertical IDs</th>
              <th className="border px-3 py-2 whitespace-nowrap font-semibold text-gray-900">Edit</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, idx) => (
              <tr key={rule.id} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                <td className="border px-3 py-2 text-center whitespace-nowrap rounded-l-lg text-black">{rule.id}</td>
                <td className="border px-3 py-2 whitespace-nowrap text-black">{rule.position}</td>
                <td className="border px-3 py-2 text-black align-top break-words whitespace-pre-line" style={{minWidth: '180px'}}>{rule.question}</td>
                <td className="border px-3 py-2 text-center whitespace-nowrap text-black">{rule.horizontal_prompts?.join(', ')}</td>
                <td className="border px-3 py-2 text-center whitespace-nowrap text-black">{rule.vertical_prompts?.join(', ')}</td>
                <td className="border px-3 py-2 text-center whitespace-nowrap rounded-r-lg">
                  <button className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition" onClick={() => handleEdit(rule)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 编辑弹窗 */}
      {isShowModal && modalRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4 text-black">Edit Rule #{modalRule.id}</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSave(modalRule);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-black mb-1">Position</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={modalRule.position}
                  onChange={e => setModalRule({ ...modalRule, position: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Question</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[60px]"
                  value={modalRule.question}
                  onChange={e => setModalRule({ ...modalRule, question: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Answer</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[140px] font-mono"
                  value={modalRule.answer}
                  onChange={e => setModalRule({ ...modalRule, answer: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Horizontal Prompts (comma separated)</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={modalRule.horizontal_prompts.join(', ')}
                  onChange={e => setModalRule({ ...modalRule, horizontal_prompts: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Vertical Prompts (comma separated)</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={modalRule.vertical_prompts.join(', ')}
                  onChange={e => setModalRule({ ...modalRule, vertical_prompts: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-1 rounded bg-gray-100 text-black border border-gray-300 hover:bg-gray-200"
                  onClick={() => setIsShowModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 disabled:opacity-60"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleAdminPageComponent; 