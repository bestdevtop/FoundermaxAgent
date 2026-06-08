'use client'

import { useState } from 'react'
import { BackendLogDialog } from '@/components/BackendLogDialog'
import { RefundPolicyDialog } from '@/components/RefundPolicyDialog'
import {
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
  InfoIcon,
  LockIcon,
  RobotIcon,
  ShieldIcon,
} from '@/components/Icons'

const FEATURES = [
  { icon: ShieldIcon, label: 'Accurate Answers' },
  { icon: ClockIcon, label: '24/7 Available' },
  { icon: LockIcon, label: 'Secure & Private' },
]

const SUGGESTED_PROMPTS = [
  'I want a refund for order O1025',
  "What's the return policy for gift cards?",
  'Find customer C001',
]

type Props = {
  isOpen: boolean
  onClose: () => void
  onPromptClick: (prompt: string) => void
  executionLog: string[]
  disabled?: boolean
}

export function RightSidebar({ isOpen, onClose, onPromptClick, executionLog, disabled }: Props) {
  const [logOpen, setLogOpen] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  return (
    <>
      <aside className={`right-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="right-sidebar-header">
          <h3>Info</h3>
          <button type="button" className="sidebar-close-btn" onClick={onClose} aria-label="Close info panel">
            <CloseIcon />
          </button>
        </div>

        <div className="about-card">
          <div className="about-icon">
            <RobotIcon size={32} />
          </div>
          <h3>About FoundersMax</h3>
          <p>
            FoundersMax is your intelligent AI assistant powered by advanced language models. Get
            instant answers, creative ideas, and helpful solutions.
          </p>
          <ul className="feature-list">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label}>
                <Icon size={16} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="policy-view-btn"
          onClick={() => setPolicyOpen(true)}
        >
          <ShieldIcon size={16} />
          <span>View Refund Policy</span>
        </button>

        <div className="prompts-card">
          <h3>Suggested Prompts</h3>
          <ul className="prompt-list">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  className="prompt-item"
                  onClick={() => onPromptClick(prompt)}
                  disabled={disabled}
                >
                  <span>{prompt}</span>
                  <ChevronRightIcon />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="backend-log-btn"
            onClick={() => setLogOpen(true)}
          >
            <InfoIcon size={16} />
            <span>View Backend Log</span>
          </button>
        </div>
      </aside>
      <BackendLogDialog
        isOpen={logOpen}
        onClose={() => setLogOpen(false)}
        log={executionLog}
      />
      <RefundPolicyDialog isOpen={policyOpen} onClose={() => setPolicyOpen(false)} />
      {isOpen && <div className="sidebar-overlay right-overlay" onClick={onClose} aria-hidden="true" />}
    </>
  )
}
