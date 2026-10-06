import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

export function BotanicalBanner() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 120" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <SvgLinearGradient id="bannerFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F7F7F4" stopOpacity={0} />
          <Stop offset="1" stopColor="#F7F7F4" stopOpacity={1} />
        </SvgLinearGradient>
      </Defs>

      <Rect width={390} height={120} fill="#F0E8DF" />

      <Ellipse cx={60} cy={30} rx={70} ry={45} fill="#D9A28B" opacity={0.25} />
      <Ellipse cx={330} cy={90} rx={80} ry={50} fill="#C4855F" opacity={0.18} />
      <Ellipse cx={200} cy={60} rx={120} ry={60} fill="#E8C4AE" opacity={0.2} />

      <G transform="translate(18,14) rotate(-20)">
        <Ellipse cx={0} cy={0} rx={12} ry={5} fill="#687B5D" opacity={0.55} />
        <Ellipse cx={18} cy={-4} rx={10} ry={4} fill="#8A9E7A" opacity={0.45} />
        <Ellipse cx={10} cy={9} rx={9} ry={3.5} fill="#687B5D" opacity={0.4} />
        <Line x1={0} y1={0} x2={12} y2={0} stroke="#4A5E3D" strokeWidth={0.7} opacity={0.5} />
      </G>

      <G transform="translate(350,16) rotate(15)">
        <Ellipse cx={0} cy={0} rx={14} ry={5.5} fill="#8A9E7A" opacity={0.5} />
        <Ellipse cx={-16} cy={6} rx={10} ry={4} fill="#687B5D" opacity={0.45} />
        <Ellipse cx={12} cy={8} rx={8} ry={3} fill="#8A9E7A" opacity={0.4} />
        <Line x1={-14} y1={0} x2={14} y2={0} stroke="#4A5E3D" strokeWidth={0.7} opacity={0.5} />
      </G>

      <G transform="translate(195,8)">
        <Line x1={0} y1={0} x2={0} y2={28} stroke="#687B5D" strokeWidth={1.2} opacity={0.6} />
        <Ellipse cx={-7} cy={8} rx={6} ry={2.5} fill="#8A9E7A" opacity={0.55} transform="rotate(-30 -7 8)" />
        <Ellipse cx={7} cy={14} rx={6} ry={2.5} fill="#687B5D" opacity={0.5} transform="rotate(30 7 14)" />
        <Ellipse cx={-6} cy={20} rx={5} ry={2} fill="#8A9E7A" opacity={0.45} transform="rotate(-25 -6 20)" />
        <Ellipse cx={5} cy={25} rx={5} ry={2} fill="#687B5D" opacity={0.4} transform="rotate(25 5 25)" />
      </G>

      <G transform="translate(80,65)" opacity={0.55}>
        <Circle cx={0} cy={0} r={4} fill="#D9A28B" />
        <Circle cx={9} cy={-3} r={3} fill="#C4855F" />
        <Circle cx={5} cy={7} r={3.5} fill="#D9A28B" />
        <Line x1={0} y1={0} x2={-8} y2={-10} stroke="#687B5D" strokeWidth={0.8} />
        <Line x1={9} y1={-3} x2={4} y2={-12} stroke="#687B5D" strokeWidth={0.8} />
      </G>

      <G transform="translate(310,78) rotate(10)">
        <Line x1={0} y1={0} x2={0} y2={-26} stroke="#8A9E7A" strokeWidth={1} opacity={0.55} />
        <Ellipse cx={-6} cy={-8} rx={5.5} ry={2.2} fill="#687B5D" opacity={0.5} transform="rotate(-35 -6 -8)" />
        <Ellipse cx={6} cy={-15} rx={5} ry={2} fill="#8A9E7A" opacity={0.45} transform="rotate(35 6 -15)" />
        <Ellipse cx={-5} cy={-21} rx={4.5} ry={2} fill="#687B5D" opacity={0.4} transform="rotate(-30 -5 -21)" />
      </G>

      {[[135, 22], [145, 35], [280, 30], [270, 18], [155, 70], [100, 45], [240, 80], [370, 50], [30, 85], [50, 60]].map(([cx, cy], index) => (
        <Circle key={index} cx={cx} cy={cy} r={1.8} fill="#C4855F" opacity={0.3} />
      ))}

      <Rect width={390} height={40} y={80} fill="url(#bannerFade)" />
    </Svg>
  );
}
