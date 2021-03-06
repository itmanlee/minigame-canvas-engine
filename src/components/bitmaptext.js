import Element from './elements.js';
import computeLayout                   from 'css-layout';
import BitMapFont  from '../common/bitMapFont';
import Pool from '../common/pool.js';

const bitMapPool = new Pool('bitMapPool')

export default class BitMapText extends Element {
    constructor(opts) {
        let {
            style={},
            props={},
            idName='',
            className='',
            value='',
            font=''
        } = opts
        super({
            props,
            idName,
            className,
            style,
        });

        this.type = "BitMapText";
        this.ctx  = null;
        this.valuesrc = value;
        this.renderBoxes = []

        Object.defineProperty(this, "value", {
            get : function() {
                return this.valuesrc;
            },
            set : function(newValue){
                if ( newValue !== this.valuesrc) {
                    this.valuesrc = newValue;

                    this.emit('repaint');
                }
            },
            enumerable   : true,
            configurable : true
        });

        this.font= bitMapPool.get(font)
        if ( !this.font ) {
            console.error('Please invoke API `registBitMapFont` before using `BitMapText`')
        }
    }

    insert(ctx, box) {
        this.renderBoxes.push({ ctx, box });

        this.render(ctx, box)
    }

    repaint() {
        this.renderBoxes.forEach( item => {
            this.render(item.ctx, item.box);
        });
    }


    render(ctx, layoutBox) {
        /*this.style.width = 200;
        let tree = {
            style: this.parent.style,
            children: [
                {
                    style: this.style
                }
            ]
        }

        computeLayout(tree)
        console.log(tree)*/
        if (!this.font) {
            return
        }

        if ( this.font.ready ) {
            this.renderText(ctx, layoutBox)
        } else {
            this.font.event.on('text__load__done', () => {
                this.renderText(ctx, layoutBox)
            })
        }
    }

    getTextBounds() {
        const style = this.style;

        let { letterSpacing = 0 } = style;

        let width = 0;
        let offsetX = 0;
        let offsetY = 0;

        for ( let i = 0, len = this.value.length; i < len; i++ ) {
            let char = this.value[i];
            let cfg = this.font.chars[char]
            if ( cfg ) {
                width += cfg.w

                if ( i < len - 1 ) {
                    width += letterSpacing
                }
            }
        }

        return { width, height: this.font.lineHeight}
    }

    renderText(ctx, layoutBox) {
        let bounds = this.getTextBounds()
        let defaultLineHeight = this.font.lineHeight;

        ctx.save();
        this.renderBorder(ctx, layoutBox);

        const box = layoutBox || this.layoutBox;
        const style = this.style;

        let {
            width, // 没有设置采用计算出来的宽度
            height, // 没有设置则采用计算出来的宽度
            lineHeight = defaultLineHeight, // 没有设置则采用计算出来的高度
            textAlign, // 文字左右对齐方式
            textBaseline, // 文字垂直对齐方式
            verticalAlign
        } =  style;

        // 元素包围盒的左上角坐标
        let x = box.absoluteX;
        let y = box.absoluteY;

        let scaleY    = lineHeight / defaultLineHeight;
        let realWidth = scaleY * bounds.width

        // 如果文字的渲染区域高度小于盒子高度，采用对齐方式
        if ( lineHeight < height ) {
            if ( verticalAlign === 'middle' ) {
                y += (height - lineHeight) / 2
            } else if ( verticalAlign === 'bottom' ) {
                y = y + height - lineHeight;
            } else {
                y += ( height - lineHeight) / 2
            }
        }

        if ( width > realWidth ) {
            if ( textAlign === 'center' ) {
                x += ( width - realWidth) / 2
            } else if ( textAlign === 'right') {
                x += ( width - realWidth)
            }
        }

        for ( let i = 0; i < this.value.length; i++ ) {
            let char = this.value[i];
            let cfg = this.font.chars[char]

            if ( cfg ) {
                ctx.drawImage(
                    this.font.texture,
                    cfg.x,
                    cfg.y,
                    cfg.w,
                    cfg.h,
                    x + cfg.offX * scaleY,
                    y + cfg.offY * scaleY,
                    cfg.w * scaleY,
                    cfg.h * scaleY
                )

                x += cfg.w * scaleY;
            }
        }
    }
}

