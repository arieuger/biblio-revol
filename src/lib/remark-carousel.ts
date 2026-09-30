import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

export default function remarkCarousel() {
  return (tree: any) => {
    visit(tree, (node) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        if (node.name !== 'carousel') return;

        const data = node.data || (node.data = {});
        const hast = h('div', { class: 'custom-carousel' });

        data.hName = hast.tagName;
        data.hProperties = hast.properties;
      }
    });
  };
}
