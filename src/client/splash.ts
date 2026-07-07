// Active frontend companion for splash.html
document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('play-button');

    if (playButton) {
        playButton.addEventListener('click', () => {
            // Tell the parent Devvit shell to expand the view window and mount game.html
            window.parent.postMessage({
                type: 'LAUNCH_GAME',
                target: 'game.html'
            }, '*');
        });
    }
});