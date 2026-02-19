import { render, screen } from './test-utils';
import '@testing-library/jest-dom';

test('renders hello world', () => {
  render(<div>Hello World</div>);
  const linkElement = screen.getByText(/Hello World/i);
  expect(linkElement).toBeInTheDocument();
});
