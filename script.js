document.querySelectorAll('.filter-chip').forEach(button => {
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(chip => {
      const selected = chip === button;
      chip.classList.toggle('active', selected);
      chip.setAttribute('aria-pressed', String(selected));
    });
    let count = 0;
    document.querySelectorAll('.post[data-categories]').forEach(post => {
      const visible = button.textContent === 'All' || post.dataset.categories.split(' ').includes(button.textContent);
      post.hidden = !visible;
      if (visible) count++;
    });
    const empty = document.querySelector('.filter-empty');
    if (empty) empty.hidden = count !== 0;
  });
});
