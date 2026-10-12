import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

const unlockButton = () => screen.getByRole('button', { name: /unlock full potential/i });

describe('App', () => {
  it('renders the locked hero', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /hire me to unlock your team's full potential/i })).toBeInTheDocument();
    expect(unlockButton()).toBeEnabled();
    expect(screen.getByRole('link', { name: /download cv/i })).toHaveAttribute('href', '/Nazar_Dzys_CV.pdf');
    expect(screen.queryByRole('heading', { name: 'Nazar Dzys' })).not.toBeInTheDocument();
  });

  it('unlocks the profile and moves focus to the name', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(unlockButton());
    expect(screen.getByRole('button', { name: /unlocking/i })).toBeDisabled();

    const name = await screen.findByRole('heading', { name: 'Nazar Dzys' });
    await waitFor(() => expect(name).toHaveFocus());
    expect(screen.getByText('Profile unlocked')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lock again/i })).toBeInTheDocument();
  });

  it('shows contact links once unlocked', async () => {
    window.history.replaceState(null, '', '/#unlocked');
    render(<App />);

    const list = await screen.findByRole('list');
    expect(within(list).getByRole('link', { name: 'nazardzys@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:nazardzys@gmail.com',
    );
    const github = within(list).getByRole('link', { name: /github/i });
    expect(github).toHaveAttribute('href', 'https://github.com/ndzys');
    expect(github).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.queryByText(/linkedin/i)).not.toBeInTheDocument();
  });

  it('locks again and returns focus to the unlock button', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/#unlocked');
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /lock again/i }));

    await waitFor(() => expect(unlockButton()).toHaveFocus());
    expect(screen.queryByRole('heading', { name: 'Nazar Dzys' })).not.toBeInTheDocument();
  });

  it('opens the mini-game and closes it with Escape', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/#unlocked');
    render(<App />);

    const play = await screen.findByRole('button', { name: /mini-game/i });
    await user.click(play);
    expect(await screen.findByRole('dialog', { name: 'Ship it!' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(play).toHaveFocus();
  });

  it('opens the mini-game with the Konami code', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}{ArrowDown}{ArrowLeft}{ArrowRight}{ArrowLeft}{ArrowRight}ba');
    expect(await screen.findByRole('dialog', { name: 'Ship it!' })).toBeInTheDocument();
  });

  it('keeps the URL in sync with the unlocked state', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(unlockButton());
    await screen.findByRole('heading', { name: 'Nazar Dzys' });
    expect(window.location.hash).toBe('#unlocked');

    await user.click(screen.getByRole('button', { name: /lock again/i }));
    await waitFor(() => expect(window.location.hash).toBe(''));
  });

  it('unlocks when the hash changes in an open tab', async () => {
    render(<App />);
    window.location.hash = '#unlocked';
    expect(await screen.findByRole('heading', { name: 'Nazar Dzys' })).toBeInTheDocument();
  });
});
