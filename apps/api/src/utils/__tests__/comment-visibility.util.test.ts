import { filterCommentsForRole, CommentEntity } from '../comment-visibility.util';

describe('Test-First Function 2: filterCommentsForRole', () => {
  const sampleComments: CommentEntity[] = [
    {
      id: 1,
      ticketId: 100,
      authorId: 10,
      body: 'Public customer note: system rebooted',
      isInternal: false,
      createdAt: new Date('2026-11-10T10:00:00Z'),
    },
    {
      id: 2,
      ticketId: 100,
      authorId: 2,
      body: 'Internal agent note: customer is on enterprise SLA',
      isInternal: true,
      createdAt: new Date('2026-11-10T10:05:00Z'),
    },
    {
      id: 3,
      ticketId: 100,
      authorId: 2,
      body: 'Public agent note: we have deployed a patch',
      isInternal: false,
      createdAt: new Date('2026-11-10T10:15:00Z'),
    },
  ];

  it('should strictly exclude internal comments when user role is customer', () => {
    const visible = filterCommentsForRole(sampleComments, 'customer');
    expect(visible).toHaveLength(2);
    expect(visible.map((c) => c.id)).toEqual([1, 3]);
    expect(visible.some((c) => c.isInternal)).toBe(false);
  });

  it('should include all comments (both public and internal) when user role is agent', () => {
    const visible = filterCommentsForRole(sampleComments, 'agent');
    expect(visible).toHaveLength(3);
    expect(visible.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it('should include all comments (both public and internal) when user role is admin', () => {
    const visible = filterCommentsForRole(sampleComments, 'admin');
    expect(visible).toHaveLength(3);
    expect(visible.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it('should return empty array when input comments array is empty', () => {
    expect(filterCommentsForRole([], 'customer')).toEqual([]);
    expect(filterCommentsForRole([], 'agent')).toEqual([]);
  });
});
