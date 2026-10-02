import { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, Clock, Tag } from 'lucide-react';
import { TodoItem, TodoPriority, TodoRecurrence } from '../../types';
import { toDateInputValue } from '../../utils/dateUtils';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (todo: TodoItem) => void;
  initialTodo?: TodoItem | null;
}

const CATEGORY_PRESETS = ['家務', '採買', '繳費', '聯絡', '醫療', '其他'];

export function TodoModal({
  isOpen,
  onClose,
  onSave,
  initialTodo,
}: TodoModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('家務');
  const [customCategory, setCustomCategory] = useState('');
  const [dueDate, setDueDate] = useState(toDateInputValue());
  const [dueTime, setDueTime] = useState('12:00');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [recurrence, setRecurrence] = useState<TodoRecurrence>('none');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialTodo) {
      setTitle(initialTodo.title);
      if (CATEGORY_PRESETS.includes(initialTodo.category)) {
        setCategory(initialTodo.category);
        setCustomCategory('');
      } else {
        setCategory('自訂');
        setCustomCategory(initialTodo.category);
      }
      setDueDate(initialTodo.dueDate);
      setDueTime(initialTodo.dueTime || '12:00');
      setPriority(initialTodo.priority);
      setRecurrence(initialTodo.recurrence);
      setNotes(initialTodo.notes || '');
    } else {
      setTitle('');
      setCategory('家務');
      setCustomCategory('');
      setDueDate(toDateInputValue());
      setDueTime('12:00');
      setPriority('medium');
      setRecurrence('none');
      setNotes('');
    }
  }, [initialTodo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = category === '自訂' ? customCategory.trim() || '其他' : category;

    const todoToSave: TodoItem = {
      id: initialTodo?.id || `todo-${Date.now()}`,
      title: title.trim(),
      category: finalCategory,
      dueDate,
      dueTime: dueTime || undefined,
      priority,
      isCompleted: initialTodo?.isCompleted || false,
      completedAt: initialTodo?.completedAt,
      recurrence,
      notes: notes.trim() || undefined,
      createdAt: initialTodo?.createdAt || new Date().toISOString(),
    };

    onSave(todoToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">
              {initialTodo ? '編輯日常瑣事' : '新增日常瑣事'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              瑣事待辦名稱 *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：整理本週血壓記錄表、超商繳費"
              className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              分類標籤
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PRESETS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    category === cat
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategory('自訂')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  category === '自訂'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                自訂...
              </button>
            </div>

            {category === '自訂' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="輸入自訂分類名稱（如：運動健走、園藝）"
                className="mt-2 w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            )}
          </div>

          {/* Due date & time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                到期日期
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                預定時間 (選填)
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Priority & Recurrence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                優先級
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TodoPriority)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="high">🔴 高優先級</option>
                <option value="medium">🟡 中優先級</option>
                <option value="low">🟢 低優先級</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                重複週期
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as TodoRecurrence)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="none">不重複</option>
                <option value="daily">每天重複</option>
                <option value="weekly">每週重複</option>
                <option value="monthly">每月重複</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              備註說明 (選填)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如：帶環保袋與健保卡、條碼繳費單"
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              儲存瑣事
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
