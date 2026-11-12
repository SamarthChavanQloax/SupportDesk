import { validateAndSanitizeTicketQuery } from '../ticket-query.util';

describe('Test-First Function 1: validateAndSanitizeTicketQuery', () => {
  it('should apply default pagination (page=1, limit=10, sortBy=createdAt, sortOrder=desc) when empty', () => {
    const result = validateAndSanitizeTicketQuery({});
    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('should parse valid page and limit numbers from strings', () => {
    const result = validateAndSanitizeTicketQuery({ page: '3', limit: '25' });
    expect(result.isValid).toBe(true);
    expect(result.data?.page).toBe(3);
    expect(result.data?.limit).toBe(25);
  });

  it('should reject invalid page numbers (non-numeric or less than 1)', () => {
    const resultInvalidStr = validateAndSanitizeTicketQuery({ page: 'abc' });
    expect(resultInvalidStr.isValid).toBe(false);
    expect(resultInvalidStr.errors).toBeDefined();

    const resultZero = validateAndSanitizeTicketQuery({ page: '0' });
    expect(resultZero.isValid).toBe(false);
  });

  it('should enforce limit bounds (max 100)', () => {
    const resultOverLimit = validateAndSanitizeTicketQuery({ limit: '150' });
    expect(resultOverLimit.isValid).toBe(false);
  });

  it('should accept allowed sortable fields and reject unauthorized sort fields', () => {
    const validSort = validateAndSanitizeTicketQuery({ sortBy: 'priority', sortOrder: 'asc' });
    expect(validSort.isValid).toBe(true);
    expect(validSort.data?.sortBy).toBe('priority');
    expect(validSort.data?.sortOrder).toBe('asc');

    const invalidSort = validateAndSanitizeTicketQuery({ sortBy: 'password_hash' });
    expect(invalidSort.isValid).toBe(false);
  });

  it('should sanitize search string by trimming whitespace', () => {
    const result = validateAndSanitizeTicketQuery({ search: '   login issue   ' });
    expect(result.isValid).toBe(true);
    expect(result.data?.search).toBe('login issue');
  });

  it('should validate status and priority enums', () => {
    const valid = validateAndSanitizeTicketQuery({ status: 'open', priority: 'P1' });
    expect(valid.isValid).toBe(true);
    expect(valid.data?.status).toBe('open');
    expect(valid.data?.priority).toBe('P1');

    const invalidStatus = validateAndSanitizeTicketQuery({ status: 'archived_invalid' });
    expect(invalidStatus.isValid).toBe(false);
  });
});

