'use client'

import { useEffect, useState } from 'react'
import { CloseIcon } from '@/components/Icons'
import { AGENT_TOOLS, PROJECT_TREE, REQUEST_FLOW } from '@/lib/architecture-data'

type Tab = 'flow' | 'tools' | 'structure'

type Props = {
  isOpen: boolean
  onClose: () => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'flow', label: 'Request Flow' },
  { id: 'tools', label: 'Agent Tools' },
  { id: 'structure', label: 'Project Structure' },
]

export function ArchitectureFlowDialog({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('flow')

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="dialog-panel dialog-panel-architecture"
        role="dialog"
        aria-labelledby="architecture-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="architecture-title">How This App Works</h2>
          <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="Close dialog">
            <CloseIcon />
          </button>
        </div>

        <div className="arch-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`arch-tab ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="dialog-body">
          {tab === 'flow' && (
            <div className="arch-flow" role="tabpanel">
              <p className="arch-intro">
                When you send a chat message, it travels through these steps from the browser to the AI agent and
                back.
              </p>
              <div className="flow-diagram">
                {REQUEST_FLOW.map((step, index) => (
                  <div key={step.id} className="flow-step-group">
                    <div className="flow-step">
                      <div className="flow-step-badge">{step.id}</div>
                      <div className="flow-step-body">
                        <h3>{step.title}</h3>
                        <code className="flow-step-path">{step.path}</code>
                        <p>{step.description}</p>
                        {step.detail && <p className="flow-step-detail">{step.detail}</p>}
                      </div>
                    </div>
                    {index < REQUEST_FLOW.length - 1 && (
                      <div className="flow-connector" aria-hidden="true">
                        <span className="flow-connector-line" />
                        <span className="flow-connector-arrow">▼</span>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flow-tools-branch">
                  <div className="flow-branch-label">Step 6 — tools the agent can call</div>
                  <div className="flow-tools-grid">
                    {AGENT_TOOLS.map((tool) => (
                      <div key={tool.name} className="flow-tool-chip">
                        <span className="flow-tool-name">{tool.name}</span>
                        <span className="flow-tool-source">{tool.dataSource}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'tools' && (
            <div className="arch-tools" role="tabpanel">
              <p className="arch-intro">
                The LangChain agent has {AGENT_TOOLS.length} tools. It picks the right one(s) based on your question.
              </p>
              <div className="tools-grid">
                {AGENT_TOOLS.map((tool) => (
                  <article key={tool.name} className="tool-card">
                    <header className="tool-card-header">
                      <code className="tool-card-name">{tool.name}</code>
                      <span className="tool-card-service">{tool.service}</span>
                    </header>
                    <p className="tool-card-desc">{tool.description}</p>
                    <dl className="tool-card-meta">
                      <div>
                        <dt>Data source</dt>
                        <dd>{tool.dataSource}</dd>
                      </div>
                      <div>
                        <dt>Use when</dt>
                        <dd>{tool.useWhen}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </div>
          )}

          {tab === 'structure' && (
            <div className="arch-structure" role="tabpanel">
              <p className="arch-intro">
                Folder layout of the FoundersMax Agent project and where each piece lives.
              </p>
              <pre className="arch-tree">{PROJECT_TREE}</pre>
              <div className="arch-legend">
                <h3>Key layers</h3>
                <ul>
                  <li>
                    <strong>UI</strong> — React components + useChatSessions hook (browser / localStorage)
                  </li>
                  <li>
                    <strong>API</strong> — Next.js route handlers under app/api/
                  </li>
                  <li>
                    <strong>Agent</strong> — LangChain setup, system prompt, runAgent()
                  </li>
                  <li>
                    <strong>Tools</strong> — 9 LangChain tools wired to services
                  </li>
                  <li>
                    <strong>Services</strong> — Business logic reading JSON, FAISS, or in-memory stores
                  </li>
                  <li>
                    <strong>Data</strong> — Static JSON files, policy/FAQ text, pre-built vector indexes
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
