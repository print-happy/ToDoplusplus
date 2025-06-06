import React from 'react';
import dayjs from 'dayjs';

interface Todo {
  _id: string;
  user: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  xmlContent?: string;
  isAIGenerated?: boolean;
  isStarred?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  tasks: Todo[];
  theme: any;
  onToggleTodo: (id: string) => void;
  onToggleStar: (id: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  date,
  tasks,
  theme,
  onToggleTodo,
  onToggleStar
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY年MM月DD日');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高优先级';
      case 'medium': return '中优先级';
      case 'low': return '低优先级';
      default: return '普通';
    }
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <div>
            <h2 style={{ 
              margin: '0 0 4px 0', 
              fontSize: '20px', 
              fontWeight: '600',
              color: theme[600]
            }}>
              {formatDate(date)}
            </h2>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: '#6b7280' 
            }}>
              共 {tasks.length} 个任务 · {pendingTasks.length} 个待办 · {completedTasks.length} 个已完成
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Task Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#374151', 
                margin: '0 0 12px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="material-icons" style={{ fontSize: '20px', color: theme[500] }}>
                  radio_button_unchecked
                </span>
                待办任务 ({pendingTasks.length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingTasks.map(task => (
                  <div
                    key={task._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <button
                      onClick={() => onToggleTodo(task._id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        marginRight: '12px',
                        padding: '4px'
                      }}
                      className="material-icons"
                    >
                      radio_button_unchecked
                    </button>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '14px', 
                          fontWeight: '500',
                          color: '#374151'
                        }}>
                          {task.title}
                        </h4>
                        
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: getPriorityColor(task.priority),
                          color: 'white',
                          fontWeight: '500'
                        }}>
                          {getPriorityText(task.priority)}
                        </span>
                        
                        {task.isAIGenerated && (
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#8b5cf6',
                            color: 'white',
                            fontWeight: '500'
                          }}>
                            AI
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p style={{ 
                          margin: 0, 
                          fontSize: '12px', 
                          color: '#6b7280',
                          lineHeight: '1.4'
                        }}>
                          {task.description}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => onToggleStar(task._id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: task.isStarred ? theme[500] : '#9ca3af',
                        padding: '4px'
                      }}
                      className="material-icons"
                    >
                      {task.isStarred ? 'star' : 'star_border'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#374151', 
                margin: '0 0 12px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="material-icons" style={{ fontSize: '20px', color: '#10b981' }}>
                  check_circle
                </span>
                已完成任务 ({completedTasks.length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {completedTasks.map(task => (
                  <div
                    key={task._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '8px',
                      border: '1px solid #bae6fd',
                      opacity: 0.8
                    }}
                  >
                    <button
                      onClick={() => onToggleTodo(task._id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#10b981',
                        marginRight: '12px',
                        padding: '4px'
                      }}
                      className="material-icons"
                    >
                      check_circle
                    </button>
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: '0 0 4px 0', 
                        fontSize: '14px', 
                        fontWeight: '500',
                        color: '#6b7280',
                        textDecoration: 'line-through'
                      }}>
                        {task.title}
                      </h4>
                      
                      {task.description && (
                        <p style={{ 
                          margin: 0, 
                          fontSize: '12px', 
                          color: '#9ca3af',
                          textDecoration: 'line-through',
                          lineHeight: '1.4'
                        }}>
                          {task.description}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => onToggleStar(task._id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: task.isStarred ? theme[500] : '#9ca3af',
                        padding: '4px'
                      }}
                      className="material-icons"
                    >
                      {task.isStarred ? 'star' : 'star_border'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {tasks.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6b7280'
            }}>
              <span className="material-icons" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
                event_available
              </span>
              <p style={{ margin: 0, fontSize: '16px' }}>
                这一天没有安排任务
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
