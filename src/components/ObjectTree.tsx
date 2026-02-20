import { useState } from 'react'
import { logger } from '../utils/logger'
import './ObjectTree.css'

export type NodeType = 'group' | 'light' | 'decoration' | 'snake' | 'food' | 'mesh' | 'arena' | 'floor' | 'sky'

export interface TreeNode {
  id: string
  label: string
  type: NodeType
  children?: TreeNode[]
  objectRef?: any // Reference to Three.js object for selection
  visible?: boolean // For lights and other toggleable objects
  helperRef?: any // Reference to helper object (for lights)
}

interface ObjectTreeProps {
  nodes: TreeNode[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onVisibilityToggle?: (id: string, visible: boolean) => void
}

export function ObjectTree({ nodes, selectedId, onSelect, onVisibilityToggle }: ObjectTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Start with all groups expanded
    const expanded = new Set<string>()
    const collectGroupIds = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        if (node.type === 'group') {
          expanded.add(node.id)
          if (node.children) {
            collectGroupIds(node.children)
          }
        }
      })
    }
    collectGroupIds(nodes)
    return expanded
  })

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
        logger.debug('ObjectTree: Group collapsed', { groupId })
      } else {
        next.add(groupId)
        logger.debug('ObjectTree: Group expanded', { groupId })
      }
      return next
    })
  }

  const handleNodeClick = (node: TreeNode) => {
    if (node.type === 'group') {
      toggleGroup(node.id)
    } else {
      // Leaf node - toggle selection
      if (selectedId === node.id) {
        onSelect(null)
        logger.debug('ObjectTree: Node deselected', { nodeId: node.id, type: node.type })
      } else {
        onSelect(node.id)
        logger.debug('ObjectTree: Node selected', { nodeId: node.id, type: node.type })
      }
    }
  }

  const handleVisibilityClick = (e: React.MouseEvent, node: TreeNode) => {
    e.stopPropagation() // Prevent node selection
    if (onVisibilityToggle && node.visible !== undefined) {
      onVisibilityToggle(node.id, !node.visible)
      logger.debug('ObjectTree: Visibility toggled', { nodeId: node.id, visible: !node.visible })
    }
  }

  const renderNode = (node: TreeNode, depth: number = 0): JSX.Element => {
    const isGroup = node.type === 'group'
    const isExpanded = expandedGroups.has(node.id)
    const isSelected = selectedId === node.id

    return (
      <div key={node.id} className="tree-node-container" style={{ marginLeft: `${depth * 16}px` }}>
        <div
          className={`tree-node ${isSelected ? 'selected' : ''} ${isGroup ? 'group' : 'leaf'}`}
          onClick={() => handleNodeClick(node)}
        >
          <span className="tree-node-label">
            {isGroup && (
              <span className="tree-icon">{isExpanded ? '▼' : '▶'}</span>
            )}
            {!isGroup && (
              <span className="tree-type-badge" data-type={node.type}>
                {getTypeIcon(node.type)}
              </span>
            )}
            <span className="tree-node-text">{node.label}</span>
            {node.visible !== undefined && (
              <button
                className="visibility-toggle"
                onClick={(e) => handleVisibilityClick(e, node)}
                title={node.visible ? 'Hide' : 'Show'}
              >
                {node.visible ? '👁' : '👁‍🗨'}
              </button>
            )}
          </span>
        </div>
        {isGroup && isExpanded && (
          <div className="tree-children">
            {node.children && node.children.length > 0 ? (
              node.children.map((child) => renderNode(child, depth + 1))
            ) : (
              <div className="tree-empty" style={{ marginLeft: `${(depth + 1) * 16}px` }}>
                (empty)
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="object-tree">
      {nodes.map((node) => renderNode(node, 0))}
    </div>
  )
}

function getTypeIcon(type: NodeType): string {
  switch (type) {
    case 'light':
      return '💡'
    case 'decoration':
      return '🎨'
    case 'snake':
      return '🐍'
    case 'food':
      return '🍎'
    case 'mesh':
      return '⬜'
    case 'arena':
      return '🏟️'
    case 'floor':
      return '▦'
    case 'sky':
      return '☁️'
    case 'group':
      return '📁'
    default:
      return '●'
  }
}
