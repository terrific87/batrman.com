# batraman.com

Personal website for Amandeep Batra, prepared from V4.

## Publish
In this repository, open Settings → Pages. Select Deploy from a branch, then main and / (root), and Save.
The initial address is https://terrific87.github.io/batrman.com/.

All links are relative, so the site also works on batraman.com when the custom domain is connected. Configure the domain in GitHub Pages after DNS is ready.

## Update content
Ask Codex to add or edit a blog post, travel entry or product in this repository. The article template is blog-template.html. Copy it into blogs/<slug>/index.html and adjust paths for its depth before publishing. Link published articles from blogs/index.html.

Blog cards and travel entries are upcoming content. The shop is a concept catalogue and does not accept orders. Checkout, fulfilment and stock management need to be connected before sales begin.

## Check locally
Run `python3 -m http.server 8000` in this folder, then open http://localhost:8000.

Original supplied portrait and speaking photo are included in assets/. No analytics or tracking scripts are installed.


## Publishing with Pages CMS

Open https://app.pagescms.org, select terrific87/batrman.com and the main branch. The editor reads `.pages.yml`. Refresh or reopen the repository if its sections are not visible yet.

1. Choose Journal, Travel, Published Work or Shop.
2. Add an item (or select an existing one). Enter a unique address using lowercase letters and hyphens, a title and a short introduction.
3. Upload a cover photo and describe it. Use Post content for text, headings and additional photos.
4. Choose the topic or work type, where applicable. Turn on Show on website when ready.
5. Save. GitHub Pages redeploys automatically; allow a minute or two, then refresh the website.

Journal and Travel posts get their own reading pages. Published Work links to the original article, podcast or patent. Shop items only show an Order link when marked Available and given a checkout URL. Leave concepts marked Concept.

Keep addresses unique within a section, and avoid changing them after sharing a post link. Items with Show on website turned off are excluded from website lists and reading pages, although repository content remains accessible on GitHub. Existing travel photo galleries are separate from new journal entries.
