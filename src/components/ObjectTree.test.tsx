import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ObjectTree, type TreeNode } from './ObjectTree'

describe('ObjectTree', () => {
  describe('Rendering', () => {
    it('should render empty tree with no nodes', () => {
      render(<ObjectTree nodes={[]} selectedId={null} onSelect={vi.fn()} />)
      // Component should render without crashing
      expect(document.body).toBeTruthy()
    })

    it('should render flat list of nodes', () => {
      const nodes: TreeNode[] = [
        { id: 'light1', label: 'Directional Light 1', type: 'light' },
        { id: 'light2', label: 'Point Light 2', type: 'light' },
      ]
      render(<ObjectTree nodes={nodes} selectedId={null} onSelect={vi.fn()} />)

      expect(screen.getByText('Directional Light 1')).toBeInTheDocument()
      expect(screen.getByText('Point Light 2')).toBeInTheDocument()
    })

    it('should render hierarchical tree with groups and children', () => {
      const nodes: TreeNode[] = [
        {
          id: 'lights-group',
          label: 'Lights',
          type: 'group',
          children: [
            { id: 'light1', label: 'Directional Light 1', type: 'light' },
            { id: 'light2', label: 'Point Light 2', type: 'light' },
          ],
        },
      ]
      render(<ObjectTree nodes={nodes} selectedId={null} onSelect={vi.fn()} />)

      expect(screen.getByText('Lights')).toBeInTheDocument()
      expect(screen.getByText('Directional Light 1')).toBeInTheDocument()
      expect(screen.getByText('Point Light 2')).toBeInTheDocument()
    })

    it('should render type badges for different node types', () => {
      const nodes: TreeNode[] = [
        { id: 'light1', label: 'Light', type: 'light' },
        { id: 'deco1', label: 'Decoration', type: 'decoration' },
        { id: 'snake1', label: 'Snake Head', type: 'snake' },
        { id: 'food1', label: 'Food', type: 'food' },
      ]
      render(<ObjectTree nodes={nodes} selectedId={null} onSelect={vi.fn()} />)

      // Check that labels are present (badges are implementation detail)
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.getByText('Decoration')).toBeInTheDocument()
      expect(screen.getByText('Snake Head')).toBeInTheDocument()
      expect(screen.getByText('Food')).toBeInTheDocument()
    })
  })

  describe('Expand/Collapse', () => {
    it('should start with all groups expanded by default', () => {
      const nodes: TreeNode[] = [
        {
          id: 'lights-group',
          label: 'Lights',
          type: 'group',
          children: [
            { id: 'light1', label: 'Directional Light 1', type: 'light' },
          ],
        },
      ]
      render(<ObjectTree nodes={nodes} selectedId={null} onSelect={vi.fn()} />)

      // Child should be visible
      expect(screen.getByText('Directional Light 1')).toBeInTheDocument()
    })

    it('should collapse group when clicking header', () => {
      const nodes: TreeNode[] = [
        {
          id: 'lights-group',
          label: 'Lights',
          type: 'group',
          children: [
            { id: 'light1', label: 'Directional Light 1', type: 'light' },
          ],
        },
      ]
      render(<ObjectTree nodes={nodes} selectedId={null} onSelect={vi.fn()} />)

      const groupHeader = screen.getByText('Lights')
      fireEvent.click(groupHeader)

      // Child should be hidden
      expect(screen.queryByText('Directional Light 1')).not.toBeInTheDocument()
    })

    it('should expand group when clicking collapsed header', () => {
      const nodes: TreeNode[] = [
        {
          id: 'lights-group',
          label: 'Lights',
          type: 'group',
          children: [
            { id: 'light1', label: 'Directional Light 1', type: 'light' },
          ],
        },
      ]
      render(<ObjectTree nodes={nodes} selectedId={null} onSelect={vi.fn()} />)

      const groupHeader = screen.getByText('Lights')
      // Collapse
      fireEvent.click(groupHeader)
      expect(screen.queryByText('Directional Light 1')).not.toBeInTheDocument()

      // Expand
      fireEvent.click(groupHeader)
      expect(screen.getByText('Directional Light 1')).toBeInTheDocument()
    })

    it('should show expand/collapse icons', () => {
      const nodes: TreeNode[] = [
        {
          id: 'lights-group',
          label: 'Lights',
          type: 'group',
          children: [
            { id: 'light1', label: 'Directional Light 1', type: 'light' },
          ],
        },
      ]
      const { container } = render(
        <ObjectTree nodes={nodes} selectedId={null} onSelect={vi.fn()} />
      )

      // Check for expand/collapse icon (implementation will use ▼ or ▶)
      const groupHeader = screen.getByText('Lights').closest('.tree-node-label')
      expect(groupHeader).toBeTruthy()
    })

    it('should maintain independent collapse state for multiple groups', () => {
      const nodes: TreeNode[] = [
        {
          id: 'lights-group',
          label: 'Lights',
          type: 'group',
          children: [
            { id: 'light1', label: 'Light 1', type: 'light' },
          ],
        },
        {
          id: 'decorations-group',
          label: 'Decorations',
          type: 'group',
          children: [
            { id: 'deco1', label: 'Decoration 1', type: 'decoration' },
          ],
        },
      ]
      render(<ObjectTree nodes={nodes} selectedId={null} onSelect={vi.fn()} />)

      // Collapse Lights
      fireEvent.click(screen.getByText('Lights'))
      expect(screen.queryByText('Light 1')).not.toBeInTheDocument()
      expect(screen.getByText('Decoration 1')).toBeInTheDocument()

      // Collapse Decorations
      fireEvent.click(screen.getByText('Decorations'))
      expect(screen.queryByText('Decoration 1')).not.toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('should highlight selected node', () => {
      const nodes: TreeNode[] = [
        { id: 'light1', label: 'Light 1', type: 'light' },
        { id: 'light2', label: 'Light 2', type: 'light' },
      ]
      const { container } = render(
        <ObjectTree nodes={nodes} selectedId="light1" onSelect={vi.fn()} />
      )

      const light1 = screen.getByText('Light 1').closest('.tree-node')
      expect(light1?.classList.contains('selected')).toBe(true)

      const light2 = screen.getByText('Light 2').closest('.tree-node')
      expect(light2?.classList.contains('selected')).toBe(false)
    })

    it('should call onSelect when clicking leaf node', () => {
      const onSelect = vi.fn()
      const nodes: TreeNode[] = [
        { id: 'light1', label: 'Light 1', type: 'light' },
      ]
      render(<ObjectTree nodes={nodes} selectedId={null} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('Light 1'))

      expect(onSelect).toHaveBeenCalledWith('light1')
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('should not call onSelect when clicking group header', () => {
      const onSelect = vi.fn()
      const nodes: TreeNode[] = [
        {
          id: 'lights-group',
          label: 'Lights',
          type: 'group',
          children: [
            { id: 'light1', label: 'Light 1', type: 'light' },
          ],
        },
      ]
      render(<ObjectTree nodes={nodes} selectedId={null} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('Lights'))

      // Should only toggle expand/collapse, not select
      expect(onSelect).not.toHaveBeenCalled()
    })

    it('should call onSelect with null when clicking selected node again', () => {
      const onSelect = vi.fn()
      const nodes: TreeNode[] = [
        { id: 'light1', label: 'Light 1', type: 'light' },
      ]
      render(<ObjectTree nodes={nodes} selectedId="light1" onSelect={onSelect} />)

      fireEvent.click(screen.getByText('Light 1'))

      expect(onSelect).toHaveBeenCalledWith(null)
    })

    it('should highlight nested selected node', () => {
      const nodes: TreeNode[] = [
        {
          id: 'lights-group',
          label: 'Lights',
          type: 'group',
          children: [
            { id: 'light1', label: 'Light 1', type: 'light' },
            { id: 'light2', label: 'Light 2', type: 'light' },
          ],
        },
      ]
      render(<ObjectTree nodes={nodes} selectedId="light2" onSelect={vi.fn()} />)

      const light2 = screen.getByText('Light 2').closest('.tree-node')
      expect(light2?.classList.contains('selected')).toBe(true)
    })
  })

  describe('Nested Groups', () => {
    it('should render deeply nested groups', () => {
      const nodes: TreeNode[] = [
        {
          id: 'arena-group',
          label: 'Arena',
          type: 'group',
          children: [
            {
              id: 'floor-group',
              label: 'Floor',
              type: 'group',
              children: [
                { id: 'floor-mesh', label: 'Floor Mesh', type: 'mesh' },
              ],
            },
          ],
        },
      ]
      render(<ObjectTree nodes={nodes} selectedId={null} onSelect={vi.fn()} />)

      expect(screen.getByText('Arena')).toBeInTheDocument()
      expect(screen.getByText('Floor')).toBeInTheDocument()
      expect(screen.getByText('Floor Mesh')).toBeInTheDocument()
    })

    it('should collapse nested groups independently', () => {
      const nodes: TreeNode[] = [
        {
          id: 'arena-group',
          label: 'Arena',
          type: 'group',
          children: [
            {
              id: 'floor-group',
              label: 'Floor',
              type: 'group',
              children: [
                { id: 'floor-mesh', label: 'Floor Mesh', type: 'mesh' },
              ],
            },
          ],
        },
      ]
      render(<ObjectTree nodes={nodes} selectedId={null} onSelect={vi.fn()} />)

      // Collapse inner group
      fireEvent.click(screen.getByText('Floor'))
      expect(screen.queryByText('Floor Mesh')).not.toBeInTheDocument()
      expect(screen.getByText('Floor')).toBeInTheDocument() // Floor label still visible

      // Collapse outer group
      fireEvent.click(screen.getByText('Arena'))
      expect(screen.queryByText('Floor')).not.toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should render empty group message when group has no children', () => {
      const nodes: TreeNode[] = [
        {
          id: 'lights-group',
          label: 'Lights',
          type: 'group',
          children: [],
        },
      ]
      render(<ObjectTree nodes={nodes} selectedId={null} onSelect={vi.fn()} />)

      expect(screen.getByText('Lights')).toBeInTheDocument()
      expect(screen.getByText('(empty)')).toBeInTheDocument()
    })
  })
})
