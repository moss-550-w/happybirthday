import { useState } from 'react';
import { useConfigContext } from './ConfigContext';
import styles from './GreetingEditor.module.css';

/**
 * 底部祝福浮层 + 页内编辑。
 * 点击「编辑」展开表单，保存到 localStorage（下次自动沿用）。
 */
export default function GreetingEditor() {
  const { config, updateGreeting } = useConfigContext();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(config.name);
  const [message, setMessage] = useState(config.message);

  const open = () => {
    setName(config.name);
    setMessage(config.message);
    setEditing(true);
  };

  const save = () => {
    updateGreeting({
      name: name.trim() || config.name,
      message: message.trim() || config.message,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={styles.editorOverlay}>
        <div className={styles.panel}>
          <label className={styles.label}>
            称呼
            <input
              className={styles.input}
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
              placeholder="致谁"
            />
          </label>
          <label className={styles.label}>
            祝福语
            <textarea
              className={styles.textarea}
              value={message}
              maxLength={60}
              rows={3}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="写下你的祝福"
            />
          </label>
          <div className={styles.actions}>
            <button
              className={styles.btnGhost}
              onClick={() => setEditing(false)}
            >
              取消
            </button>
            <button className={styles.btnPrimary} onClick={save}>
              保存
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.greeting}>
      <span className={styles.message}>{config.message}</span>
      <span className={styles.name}>致 {config.name}</span>
      <button className={styles.editBtn} onClick={open}>
        ✎ 编辑祝福
      </button>
    </div>
  );
}
