import { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Check,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Tag,
  Repeat,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { TodoItem } from '../../types';
import { TodoModal } from './TodoModal';
import { formatDateTaipei, isSameDay } from '../../utils/dateUtils';

interface TodoListProps {
  now: Date;
  todos: TodoItem[];
  onSaveTodo: (todo: TodoItem) => void;
  onDeleteTodo: (id: string) => void;
  onToggleTodo: (id: string) => void;
  onShowToast: (msg: string) => void;
  onOpenScanModal?: () => void;
}

export function TodoList({
  now,
  todos,
  onSaveTodo,
  onDeleteTodo,
  onToggleTodo,
  onShowToast,
  onOpenScanModal,
}: TodoListProps) {
  const [filter, setFilter] = useState<'pending' | 'today' | 'completed' | 'all'>('pending');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);

  const categories = Array.from(new Set(todos.map((t) => t.category).filter(Boolean)));

  const filteredTodos = todos
    .filter((todo) => {
      // Category filter
      if (selectedCategory !== 'all' && todo.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (filter === 'pending') return !todo.isCompleted;
      if (filter === 'completed') return todo.isCompleted;
      if (filter === 'today') return isSameDay(todo.dueDate, now) && !todo.isCompleted;
      return true;
    })
    .sort((a, b) => {
      // Pending first, then priority high -> low, then dueDate
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      const prioWeight = { high: 3, medium: 2, low: 1 };
      if (prioWeight[b.priority] !== prioWeight[a.priority]) {
        return prioWeight[b.priority] - prioWeight[a.priority];
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'high':
        return (
          <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
            🔴 高優先
          </span>
        );
      case 'medium':
        return (
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
            🟡 中優先
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            🟢 低優先
          </span>
        );
    }
  };

  const getRecurrenceLabel = (rec: string) => {
    switch (rec) {
      case 'daily':
        return '每天重複';
      case 'weekly':
        return '每週重複';
      case 'monthly':
        return '每月重複';
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-teal-600" />
            <span>日常瑣事與生活備忘</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            家務、採買、繳費、聯絡 · 優先級管理 · 週期重複追蹤
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenScanModal && (
            <button
              type="button"
              onClick={onOpenScanModal}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold transition-colors"
            >
              <Camera className="w-4 h-4 text-teal-600" />
              <span>拍照辨識便條/單據</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingTodo(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新增瑣事</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
              filter === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            待辦 ({todos.filter((t) => !t.isCompleted).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('today')}
            className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
              filter === 'today'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            今日待辦 ({todos.filter((t) => isSameDay(t.dueDate, now) && !t.isCompleted).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
              filter === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            已完成 ({todos.filter((t) => t.isCompleted).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            全部
          </button>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              全部分類
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  selectedCategory === cat
                    ? 'bg-teal-50 border-teal-300 text-teal-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Todo items list */}
      {filteredTodos.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          <CheckSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          目前沒有符合條件的日常瑣事。
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTodos.map((todo) => {
            const isToday = isSameDay(todo.dueDate, now);
            const isOverdue = !todo.isCompleted && new Date(todo.dueDate).getTime() < new Date(now.toISOString().split('T')[0]).getTime();

            return (
              <div
                key={todo.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  todo.isCompleted
                    ? 'bg-slate-50/70 border-slate-200 opacity-60'
                    : isOverdue
                    ? 'bg-red-50/40 border-red-200'
                    : isToday
                    ? 'bg-teal-50/30 border-teal-200'
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => {
                        onToggleTodo(todo.id);
                        if (!todo.isCompleted) {
                          onShowToast(`✓ 已完成瑣事「${todo.title}」！`);
                        }
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                        todo.isCompleted
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-slate-300 bg-white hover:border-teal-500'
                      }`}
                    >
                      {todo.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm sm:text-base font-bold ${
                            todo.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {todo.title}
                        </span>

                        {getPriorityBadge(todo.priority)}

                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {todo.category}
                        </span>

                        {todo.recurrence !== 'none' && (
                          <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1 bg-teal-50 px-1.5 py-0.5 rounded">
                            <Repeat className="w-3 h-3" />
                            {getRecurrenceLabel(todo.recurrence)}
                          </span>
                        )}
                      </div>

                      {/* Due info & notes */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={isOverdue ? 'text-red-700 font-bold' : isToday ? 'text-teal-700 font-bold' : ''}>
                            {formatDateTaipei(todo.dueDate)}
                            {isToday && ' (今天)'}
                            {isOverdue && ' (已逾期)'}
                          </span>
                        </span>

                        {todo.dueTime && (
                          <span className="flex items-center gap-1 font-mono text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {todo.dueTime}
                          </span>
                        )}

                        {todo.notes && (
                          <span className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded text-[11px]">
                            備註：{todo.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTodo(todo);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`確定要刪除「${todo.title}」嗎？`)) {
                          onDeleteTodo(todo.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <TodoModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTodo(null);
          }}
          onSave={(t) => {
            onSaveTodo(t);
            onShowToast('✓ 瑣事已儲存！');
          }}
          initialTodo={editingTodo}
        />
      )}
    </div>
  );
}
