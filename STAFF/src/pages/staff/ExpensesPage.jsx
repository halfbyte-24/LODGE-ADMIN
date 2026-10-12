import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle, RefreshCw, ShoppingCart, Calendar, IndianRupee, Clock } from 'lucide-react';

export default function ExpensesPage() {
  const { profile, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', title: '', message: '' });

  // Today's date formatted as YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [itemName, setItemName] = useState('');
  const [expenseDate, setExpenseDate] = useState(getTodayDate());
  const [amount, setAmount] = useState('');

  // Fetch only recent expenses so staff can immediately see what they submitted
  const loadRecentExpenses = async () => {
    try {
      setLoadingRecent(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('id, title, amount, expense_date, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentExpenses(data || []);
    } catch (err) {
      console.error('[ExpensesPage] Failed to load recent expenses:', err);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    loadRecentExpenses();
  }, []);

  // Intelligent category mapper so Admin dashboard & reports stay categorized
  const detectCategory = (titleText) => {
    const lower = (titleText || '').toLowerCase();
    if (lower.includes('rice') || lower.includes('oil') || lower.includes('flour') || lower.includes('atta') || lower.includes('dal') || lower.includes('masala') || lower.includes('spice') || lower.includes('চাল') || lower.includes('ডাল') || lower.includes('তেল')) {
      return 'grocery';
    }
    if (lower.includes('vegetable') || lower.includes('chicken') || lower.includes('meat') || lower.includes('fish') || lower.includes('egg') || lower.includes('milk') || lower.includes('paneer') || lower.includes('সবজি') || lower.includes('মাংস') || lower.includes('মাছ')) {
      return 'food_supplies';
    }
    if (lower.includes('gas') || lower.includes('cylinder') || lower.includes('গ্যাস')) {
      return 'gas';
    }
    if (lower.includes('clean') || lower.includes('soap') || lower.includes('detergent') || lower.includes('broom') || lower.includes('mop') || lower.includes('harpic') || lower.includes('ঝাড়ু') || lower.includes('সাবান')) {
      return 'cleaning';
    }
    if (lower.includes('electric') || lower.includes('current') || lower.includes('bulb') || lower.includes('বিদ্যুৎ')) {
      return 'electricity';
    }
    if (lower.includes('water') || lower.includes('জল') || lower.includes('পানি')) {
      return 'water';
    }
    if (lower.includes('auto') || lower.includes('van') || lower.includes('rickshaw') || lower.includes('petrol') || lower.includes.call(lower, 'diesel') || lower.includes('ভাড়া')) {
      return 'transportation';
    }
    if (lower.includes('repair') || lower.includes('plumb') || lower.includes('paint') || lower.includes('meramat')) {
      return 'maintenance';
    }
    return 'other';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedItem = itemName.trim();
    const parsedAmount = parseFloat(amount);

    // Validation
    if (!trimmedItem) {
      setFeedback({
        type: 'error',
        title: 'কী কিনেছেন লিখুন / Enter Item Name',
        message: 'খরচের নাম খালি রাখা যাবে না। (Item name cannot be empty)'
      });
      return;
    }

    if (!expenseDate) {
      setFeedback({
        type: 'error',
        title: 'তারিখ নির্বাচন করুন / Select Date',
        message: 'খরচের তারিখ নির্বাচন করুন। (Please choose a valid date)'
      });
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFeedback({
        type: 'error',
        title: 'সঠিক টাকার পরিমাণ লিখুন / Enter Valid Amount',
        message: 'টাকার পরিমাণ ০ এর বেশি হতে হবে। (Amount must be greater than ₹0)'
      });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: '', title: '', message: '' });

    try {
      const staffId = profile?.id || user?.id || null;
      const category = detectCategory(trimmedItem);

      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          title: trimmedItem,
          amount: parsedAmount,
          expense_date: expenseDate,
          category: category,
          staff_id: staffId,
          status: 'approved',
          description: null
        }])
        .select()
        .single();

      if (error) throw error;

      // Reset form
      setItemName('');
      setAmount('');
      setExpenseDate(getTodayDate());

      setFeedback({
        type: 'success',
        title: 'সফলভাবে জমা হয়েছে! / Saved Successfully!',
        message: `₹${parsedAmount.toFixed(2)} - "${trimmedItem}" খরচের খাতায় যোগ হয়েছে।`
      });

      await loadRecentExpenses();
    } catch (err) {
      console.error('[ExpensesPage] Failed to save expense:', err);
      setFeedback({
        type: 'error',
        title: 'জমা করা যায়নি / Failed to Save',
        message: err.message || 'দয়া করে ইন্টারনেট চেক করুন এবং আবার চেষ্টা করুন।'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '560px',
      margin: '0 auto',
      padding: '1rem 0.85rem 3rem 0.85rem',
      fontFamily: 'inherit'
    }}>
      {/* HEADER */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1.25rem',
        padding: '0.5rem 0'
      }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: 'var(--text-main)',
          margin: '0 0 0.25rem 0',
          letterSpacing: '-0.02em'
        }}>
          খরচ জমা দিন
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--text-muted)',
          margin: 0,
          fontWeight: 500
        }}>
          Record Daily Expense
        </p>
      </div>

      {/* SUCCESS / ERROR FEEDBACK MESSAGE */}
      {feedback.message && (
        <div style={{
          padding: '1rem 1.15rem',
          borderRadius: '12px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          background: feedback.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `2px solid ${feedback.type === 'error' ? '#f87171' : '#4ade80'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          {feedback.type === 'error' ? (
            <AlertCircle size={28} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <CheckCircle2 size={28} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: feedback.type === 'error' ? '#991b1b' : '#14532d',
              marginBottom: '0.2rem'
            }}>
              {feedback.title}
            </div>
            <div style={{
              fontSize: '0.925rem',
              color: feedback.type === 'error' ? '#b91c1c' : '#15803d',
              lineHeight: 1.4
            }}>
              {feedback.message}
            </div>
          </div>
        </div>
      )}

      {/* MAIN 3-INPUT FORM */}
      <div className="card" style={{
        padding: '1.5rem 1.25rem',
        borderRadius: '16px',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid var(--border-color)',
        backgroundColor: '#ffffff'
      }}>
        <form onSubmit={handleSubmit} noValidate>
          {/* INPUT 1: WHAT DID YOU BUY? */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              cursor: 'pointer'
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-main)'
              }}>
                <ShoppingCart size={20} color="var(--primary-color)" />
                কী কিনেছেন?
              </span>
              <span style={{
                display: 'block',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                marginTop: '0.15rem',
                fontWeight: 500
              }}>
                What did you buy? (e.g. Rice, Vegetables, Gas, Electric Bill)
              </span>
            </label>
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="যেমন: চাল, সবজি, গ্যাস, সাবান..."
              disabled={submitting}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.9rem 1rem',
                fontSize: '1.2rem',
                fontWeight: 500,
                borderRadius: '12px',
                border: '2px solid #cbd5e1',
                outline: 'none',
                backgroundColor: '#f8fafc',
                transition: 'border-color 0.2s, background-color 0.2s',
                color: '#0f172a'
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--primary-color)';
                e.target.style.backgroundColor = '#ffffff';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.backgroundColor = '#f8fafc';
              }}
            />
          </div>

          {/* INPUT 2: WHEN DID YOU SPEND? */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              cursor: 'pointer'
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-main)'
              }}>
                <Calendar size={20} color="var(--primary-color)" />
                কবে খরচ করেছেন?
              </span>
              <span style={{
                display: 'block',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                marginTop: '0.15rem',
                fontWeight: 500
              }}>
                Expense date (Defaults to today)
              </span>
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={e => setExpenseDate(e.target.value)}
              disabled={submitting}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.9rem 1rem',
                fontSize: '1.15rem',
                fontWeight: 500,
                borderRadius: '12px',
                border: '2px solid #cbd5e1',
                outline: 'none',
                backgroundColor: '#f8fafc',
                color: '#0f172a'
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--primary-color)';
                e.target.style.backgroundColor = '#ffffff';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.backgroundColor = '#f8fafc';
              }}
            />
          </div>

          {/* INPUT 3: HOW MUCH DID IT COST? */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              cursor: 'pointer'
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-main)'
              }}>
                <IndianRupee size={20} color="#16a34a" />
                কত টাকা খরচ হয়েছে?
              </span>
              <span style={{
                display: 'block',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                marginTop: '0.15rem',
                fontWeight: 500
              }}>
                Amount in ₹
              </span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#64748b',
                pointerEvents: 'none'
              }}>
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={submitting}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.9rem 1rem 0.9rem 2.5rem',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  border: '2px solid #cbd5e1',
                  outline: 'none',
                  backgroundColor: '#f8fafc',
                  color: '#0f172a'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#16a34a';
                  e.target.style.backgroundColor = '#ffffff';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.backgroundColor = '#f8fafc';
                }}
              />
            </div>
          </div>

          {/* LARGE OBVIOUS SAVE BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '1.1rem 1.5rem',
              fontSize: '1.25rem',
              fontWeight: 800,
              borderRadius: '14px',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              backgroundColor: submitting ? '#94a3b8' : '#16a34a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              boxShadow: submitting ? 'none' : '0 6px 18px rgba(22, 163, 74, 0.35)',
              transition: 'background-color 0.2s, transform 0.1s',
              touchAction: 'manipulation'
            }}
            onMouseDown={e => { if (!submitting) e.currentTarget.style.transform = 'scale(0.98)'; }}
            onMouseUp={e => { if (!submitting) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {submitting ? (
              <>
                <RefreshCw size={24} className="animate-spin" />
                <span>জমা হচ্ছে... / Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={24} />
                <span>হিসাব জমা দিন / SAVE</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* RECENT SUBMISSIONS (SIMPLE AND HELPFUL FOR STAFF CONFIRMATION) */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          padding: '0 0.25rem'
        }}>
          <h2 style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <Clock size={16} color="var(--text-muted)" />
            সাম্প্রতিক খরচ (Recent)
          </h2>
          <button
            type="button"
            onClick={loadRecentExpenses}
            disabled={loadingRecent}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-color)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            <RefreshCw size={13} className={loadingRecent ? 'animate-spin' : ''} />
            রিফ্রেশ
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '1.5rem',
            color: 'var(--text-muted)',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            fontSize: '0.9rem',
            border: '1px dashed #cbd5e1'
          }}>
            এখনও কোনো খরচ জমা নেই (No recent expenses)
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentExpenses.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ minWidth: 0, flex: 1, paddingRight: '0.75rem' }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                    {item.expense_date}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#dc2626',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  ₹{Number(item.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
