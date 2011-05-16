using UnityEngine;
using UnityEditor;
using System.Collections;

public class CurveEditor
{
	public float m_ActiveTime = -Mathf.Infinity;
	public AnimationCurve m_AnimationCurve;
	public Color m_CurveColor = new Color (235 / 255.0F, 255 / 255.0F, 40 / 255.0F, 1F);
	
	Texture2D m_HelpTexture = EditorGUIUtility.FindTexture ("_Help");
	public CurveEditor (Rect rect, AnimationCurve curve)
	{
		animationCurve = curve;
		FrameSelected(rect);
	}

	public Color curveColor { get { return m_CurveColor; } set { m_CurveColor = value; } }
	public float activeTime { get { return m_ActiveTime; } set { m_ActiveTime = value; } }
	public AnimationCurve animationCurve { get { return m_AnimationCurve; } set { m_AnimationCurve = value; } }

	void UpdateTangentsFromModeSurrounding(AnimationCurve animationCurve, int index)
	{
		// -2 is needed when moving keyframes
		UpdateTangentsFromMode(animationCurve, index-2);
		
		// Update surrounding keyframes
		UpdateTangentsFromMode(animationCurve, index-1);
		UpdateTangentsFromMode(animationCurve, index);
		UpdateTangentsFromMode(animationCurve, index+1);
		
		// +2 is needed when moving keyframes
		UpdateTangentsFromMode(animationCurve, index+2);
	}
		
	// Frame Selects the curve to be completely visible
	public void FrameSelected (Rect rect)
	{
		if (animationCurve.length == 0)
			return;

		// Compute bounds from keyframes
		Vector3 pos = new Vector3 (animationCurve[0].time, animationCurve[0].value, 0);
		Bounds bounds = new Bounds(pos, Vector3.zero);
		for (int i=0;i<animationCurve.length;i++)
		{
			pos = new Vector3 (animationCurve[i].time, animationCurve[i].value, 0);
			bounds.Encapsulate(pos);
		}

		// With 50 pixel extra bounds
		if (animationCurve.length != 1)
			bounds.Expand(Mathf.Max(50 * bounds.size.magnitude / rect.width, 0.0001F));
		// Single keyframe have a 1 unit extra bounds
		else
			bounds.Expand(Mathf.Max(1, 0.0001F));
		
		// Calculate scale & translate from bounds
		m_Scale.x = Mathf.Min(rect.width / bounds.size.x, rect.height / bounds.size.y);
		m_Scale.y = -m_Scale.x;
		m_Translation.x = -bounds.min.x * m_Scale.x;
		m_Translation.y = rect.height - bounds.min.y * m_Scale.y;
	}

	public bool OnGUI (Rect rect)
	{
		bool modified = false;
			
		GUILayout.BeginArea(rect);

		Color oldColor = GUI.color;
		// Check selection indices out of bounds
		if (m_DragKey != null && (m_DragKey.index < 0 || m_DragKey.index >= animationCurve.length))
			m_DragKey = null;
		if (m_SelectedKey != null && (m_SelectedKey.index < 0 || m_SelectedKey.index >= animationCurve.length) )
			m_SelectedKey = null;
	

		modified = DisplayActionsGui (rect);
		
		bool mouseEvent = Event.current.type == EventType.mouseDown || Event.current.type == EventType.mouseDrag | Event.current.type == EventType.mouseUp;

		if (Event.current.type == EventType.repaint)
		{
			DrawGrid(rect);
			DrawCurve(animationCurve);
		}
		else if (Event.current.type == EventType.mouseDown && Event.current.clickCount == 2)
		{
			Keyframe key = new Keyframe(transformedMousePosition.x, transformedMousePosition.y);
			SetKeyTangentMode(ref key, 0, TangentMode.Smooth);
			SetKeyTangentMode(ref key, 1, TangentMode.Smooth);
			int index = animationCurve.AddKey(key);

			UpdateTangentsFromModeSurrounding(animationCurve, index);
			m_DragKey = new CurveSelection (index, SelectionType.Key);
			modified = true;	
			Event.current.Use();
		}
		else if ((Event.current.type == EventType.scrollWheel) || (mouseEvent && Event.current.command))
		{
			m_Scale *= (1 - Event.current.delta.y * 0.01F);
			m_Scale.x = Mathf.Clamp(m_Scale.x, 0.02F, 10000.0F);
			m_Scale.y = -m_Scale.x;
			Event.current.Use();
		}
		else if (mouseEvent && Event.current.alt)
		{
			m_Translation += Event.current.delta;
			Event.current.Use();
		}
		else if (Event.current.type == EventType.mouseDown)
		{
			float dist;
			CurveSelection closest = FindClosest(animationCurve, transformedMousePosition, out dist);
			if (dist < 20 / m_Scale.magnitude)
			{
				m_SelectedKey = m_DragKey = closest;
				Vector2 keyPos = GetPosition(animationCurve, m_DragKey);
				m_MouseDownOffset = keyPos - transformedMousePosition;
			}
			else
			{
				m_DragKey = null;	
			}
			Event.current.Use();
		}
		else if (Event.current.type == EventType.mouseUp)
		{
			m_SelectedKey = m_DragKey;
			m_DragKey = null;
			Event.current.Use();
		}
		else if (Event.current.type == EventType.mouseDrag && m_DragKey != null)
		{
			Keyframe key = animationCurve[m_DragKey.index];
			
			Vector2 newPosition = transformedMousePosition + m_MouseDownOffset;
			if (m_DragKey.type == SelectionType.Key)
			{
				key.time = newPosition.x;
				key.value = newPosition.y;
			}
			else if (m_DragKey.type == SelectionType.InTangent)
			{
				Vector2 tangentDirection = newPosition - new Vector2 (key.time, key.value);
				if (tangentDirection.x < -0.0001F)
					key.inTangent = tangentDirection.y / tangentDirection.x;
				else
					key.inTangent = Mathf.Infinity;
				SetKeyTangentMode(ref key, 0, TangentMode.Editable);
				
				if (!GetKeyBroken(key))
				{
					key.outTangent = key.inTangent;
					SetKeyTangentMode(ref key, 1, TangentMode.Editable);
				}
			}
			else if (m_DragKey.type == SelectionType.OutTangent)
			{
				Vector2 tangentDirection = newPosition - new Vector2 (key.time, key.value);
				if (tangentDirection.x > 0.0001F)
					key.outTangent = tangentDirection.y / tangentDirection.x;
				else
					key.outTangent = Mathf.Infinity;
				SetKeyTangentMode(ref key, 1, TangentMode.Editable);

				if (!GetKeyBroken(key))
				{
					key.inTangent = key.outTangent;
					SetKeyTangentMode(ref key, 0, TangentMode.Editable);
				}
			}
			
			m_DragKey.index = animationCurve.MoveKey(m_DragKey.index, key);

			UpdateTangentsFromModeSurrounding(animationCurve, m_DragKey.index);
			modified = true;
			
			Event.current.Use();
		}
		else if ((Event.current.type == EventType.KeyDown && Event.current.keyCode == KeyCode.Backspace) || (Event.current.type == EventType.ExecuteCommand && Event.current.commandName =="Delete"))
		{
			if (m_SelectedKey != null)
			{
				animationCurve.RemoveKey(m_SelectedKey.index);
				m_SelectedKey.index--;
				modified = true;
				Event.current.Use();
			}
		}
		else if (Event.current.type == EventType.ExecuteCommand && Event.current.commandName == "FrameSelected")
		{
			FrameSelected(rect);
			Event.current.Use();
		}
		GUILayout.EndArea();				

		GUI.color = oldColor;
		
		return modified;
	}
	
	[System.Flags]
	enum TangentMode
	{
		Editable = 0,
		Smooth = 1,
		Linear = 2,
		Stepped = 3,
	}
	internal enum SelectionType
	{
		Key = 0,
		InTangent = 1,
		OutTangent = 2,
		Count = 3,
	}
	
	internal class CurveSelection
	{
		internal CurveSelection (int i, SelectionType t) { index = i; type = t; }
		internal CurveSelection () { index = -1; type = SelectionType.Key; }
		
		internal int           index = -1;
		internal SelectionType type;
	}


	const int kBrokenMask = 1 << 0;
	const int kLeftTangentMask = 1 << 1 | 1 << 2;
	const int kRightTangentMask = 1 << 3 | 1 << 4;	
	
	CurveSelection m_SelectedKey = null;	
	CurveSelection m_DragKey = null;
	Vector2 m_Scale = new Vector2 (170, -170);
	Vector2 m_Translation = new Vector2 (28, 355);
	Vector2 m_MouseDownOffset;
	bool m_ShowHelp = false;
	static Color m_ZeroGridH = new Color (1.0F, 0.0F, 0.0F, 0.4F);
	static Color m_ZeroGridV = new Color (0.0F, 1.0F, 0.0F, 0.4F);
	static Color m_BoldGrid = new Color (0.3F, 0.3F, 0.3F, 0.4F);
	static Color m_LightGrid = new Color (0.4F, 0.4F, 0.4F, 0.1F);
	static Color m_LabelColor = new Color (0.0F, 0.0F, 0.0F, 0.4F);
	static Color m_CurrentMarkerGridColor = new Color (0.0F, 1.0F, 0.0F, 0.9F);
	static Color m_KeyColor =  new Color (0, 0, 0, 1.0F);
	static Color m_SelectedKeyColor = new Color (1, 1, 1, 0.9F);
	static Color m_TangentColor = new Color (0, 0, 1, 0.9F);
	
	Texture2D m_SpaceTexture = EditorGUIUtility.LoadRequired ("Builtin Skins/inspector images/selection.png") as Texture2D;

	void SetKeyBroken (ref Keyframe key, bool broken)
	{
		if (broken)	
			key.tangentMode |= kBrokenMask;
		else
			key.tangentMode &= ~kBrokenMask;
	}

	bool GetKeyBroken (Keyframe key)
	{
		return (key.tangentMode & kBrokenMask) != 0;
	}


	void SetKeyTangentMode (ref Keyframe key, int leftRight, TangentMode mode)
	{
		if (leftRight == 0)
		{
			key.tangentMode &= ~kLeftTangentMask;
			key.tangentMode |= (int)mode << 1;
		}
		else
		{
			key.tangentMode &= ~kRightTangentMask;
			key.tangentMode |= (int)mode << 3;
		}
		
		if (GetKeyTangentMode (key, leftRight) != mode)
			Debug.Log("bug");
	}

	TangentMode GetKeyTangentMode (Keyframe key, int leftRight)
	{
		if (leftRight == 0)
		{
			return (TangentMode)((key.tangentMode & kLeftTangentMask) >> 1);
		}
		else
		{
			return (TangentMode)((key.tangentMode & kRightTangentMask) >> 3);
		}
	}

	float CalculateLinearTangent (Keyframe from, Keyframe to)
	{
		return (from.value - to.value) / (from.time - to.time);
	}

	void UpdateTangentsFromMode (AnimationCurve curve, int index)
	{
		if (index < 0 || index >= curve.length)
			return;
		Keyframe key = curve[index];

		// Adjust linear tangent
		if (GetKeyTangentMode(key, 0) == TangentMode.Linear && index >= 1)
		{
			key.inTangent = CalculateLinearTangent(curve[index], curve[index-1]);
		}
		if (GetKeyTangentMode(key, 1) == TangentMode.Linear && index+1 < curve.length)
		{
			key.outTangent = CalculateLinearTangent(curve[index], curve[index+1]);
		}
		
		float smoothWeight = 0.0F;
//		if (index > 0 && index < curve.length - 1)
//		{
//			smoothWeight = Mathf.InverseLerp(curve[index - 1].time, curve[index + 1].time, curve[index].time) * 2 - 1;
//		}
		
		if (GetKeyTangentMode(key, 0) == TangentMode.Smooth)
		{
			curve.SmoothTangents(index, smoothWeight);
			key.inTangent = curve[index].inTangent;
		}
		if (GetKeyTangentMode(key, 1) == TangentMode.Smooth)
		{
			curve.SmoothTangents(index, smoothWeight);
			key.outTangent = curve[index].outTangent;
		}

		curve.MoveKey(index, key);
	}
		
	public Matrix4x4 transform
	{
		get
		{
			return Matrix4x4.TRS(m_Translation, Quaternion.identity, new Vector3(m_Scale.x, m_Scale.y, 1));
		}
	}
		
	// Returns the visible rect while 
	Rect GetVisibleBounds (Rect rect)
	{
		return new Rect (-m_Translation.x / m_Scale.x, -(m_Translation.y - rect.height ) / m_Scale.y, rect.width / m_Scale.x, rect.height / -m_Scale.y);
	}
	
	bool DisplayActionsGui (Rect rect)
	{
		bool modified = false;
		
		GUILayout.Space(2);
		GUILayout.BeginHorizontal();
		GUILayout.Space(2);

		GUILayout.Label("PreWrapMode: " + animationCurve.preWrapMode.ToString());
		GUILayout.FlexibleSpace();
		GUILayout.Label("PostWrapMode: " + animationCurve.preWrapMode.ToString());

		GUILayout.Space(10);
		
		if (GUILayout.Button(m_HelpTexture, GUI.skin.label))
			m_ShowHelp = !m_ShowHelp;
			
		GUILayout.Space(1);

		GUILayout.EndHorizontal();

		if (m_SelectedKey != null && m_SelectedKey.index >= 0 && m_SelectedKey.index < animationCurve.length)
		{
			GUILayout.BeginHorizontal();

			Keyframe key = animationCurve[m_SelectedKey.index];
					
			string[] tangentMode = {"Editable", "Auto Smooth", "Linear", "Stepped", "Mixed"};
			GUI.changed = false;
			TangentMode selectedTangentMode;
			if (GetKeyTangentMode(key, 0) == GetKeyTangentMode(key, 1))
				selectedTangentMode = GetKeyTangentMode(key, 0);
			else
				selectedTangentMode = (TangentMode)4; // broken
			
			GUILayout.Label("Tangents: ");			
			selectedTangentMode = (TangentMode)GUILayout.SelectionGrid((int)selectedTangentMode, tangentMode, 5);
	
			if (GUI.changed)
			{
				if (selectedTangentMode == TangentMode.Editable || selectedTangentMode == TangentMode.Smooth)
				{
					SetKeyBroken(ref key, false);
					SetKeyTangentMode(ref key, 1, selectedTangentMode);
					SetKeyTangentMode(ref key, 0, selectedTangentMode);
	
					animationCurve.MoveKey(m_SelectedKey.index, key);
					animationCurve.SmoothTangents(m_SelectedKey.index, 0.0F);
					modified = true;
				}
				else if (selectedTangentMode == TangentMode.Linear)
				{
					SetKeyTangentMode(ref key, 1, TangentMode.Linear);
					SetKeyTangentMode(ref key, 0, TangentMode.Linear);
					SetKeyBroken(ref key, true);
		
					animationCurve.MoveKey(m_SelectedKey.index, key);
					
					UpdateTangentsFromModeSurrounding(animationCurve, m_SelectedKey.index);
					modified = true;
				}
				else if (selectedTangentMode == TangentMode.Stepped)
				{
					SetKeyTangentMode(ref key, 1, TangentMode.Stepped);
					SetKeyTangentMode(ref key, 0, TangentMode.Stepped);
					SetKeyBroken(ref key, true);
					
					key.outTangent = Mathf.Infinity;
					
					m_SelectedKey.index = animationCurve.MoveKey(m_SelectedKey.index, key);
					modified = true;
				}
			}
	
			GUILayout.FlexibleSpace();		
			GUILayout.EndHorizontal();
		}

		if (m_ShowHelp)
			ShowHelp();


		// @TODO: Work around for gui layout issue
		GUILayout.FlexibleSpace();
		return modified;
	}

	void ShowHelp ()
	{
		GUI.color = new Color(1, 1, 1, 0.5F);
		GUILayout.Label(
			"Double click to add keyframe.\n" +
			"Select keyframe and move them with mouse.\n" +
			"Zoom via cmd-mouse drag or scroll wheel.\n" +
			"Scroll via alt-mouse drag.\n" +
			"F to FrameSelect entire curve.\n"
		);	
	}
	
	Vector2 transformedMouseDelta
	{
		get { return Matrix4x4.Inverse(transform).MultiplyVector(Event.current.delta); }
	}

	Vector2 transformedMousePosition
	{
		get { return Matrix4x4.Inverse(transform).MultiplyPoint(Event.current.mousePosition); }
	}

	Vector2 GetTangentScale ()
	{
		return new Vector2 (50.0F / (Mathf.Abs(m_Scale.x)), 50.0F / (Mathf.Abs(m_Scale.y)));
	}
	
	Vector2 GetPosition (AnimationCurve curve, CurveSelection selection)
	{
		Keyframe key = curve[selection.index];
		Vector2 position = new Vector2 (key.time, key.value);
		
		if (selection.type == SelectionType.InTangent)
		{
			if (key.inTangent == Mathf.Infinity)
				return position + Vector2.Scale(new Vector2(0.0F, -1.0F), GetTangentScale());
			else
			{
				Vector2 dir = new Vector2(1.0F, key.inTangent);
				dir /= dir.magnitude;
				return position - Vector2.Scale(dir, GetTangentScale ());
			}
		}
		else if (selection.type == SelectionType.OutTangent)
		{
			if (key.outTangent == Mathf.Infinity)
			{
				return position + Vector2.Scale(new Vector2(0.0F, 1.0F), GetTangentScale());
			}
			else
			{
				Vector2 dir = new Vector2(1.0F, key.outTangent);
				dir /= dir.magnitude;
				return position + Vector2.Scale(dir, GetTangentScale());
			}
		}
		else
			return position;
	}
		
	/// Finds the closest selectable point on the curve.
	/// - Key frames
	/// - if a key frame is selected, searches the tangents
	CurveSelection FindClosest (AnimationCurve curve, Vector2 mousePos, out float outDist)
	{
		float distance = Mathf.Infinity;
		CurveSelection closest = new CurveSelection();

		// Find closest key point
		for (int i=0;i<curve.length;i++)
		{
			Vector2 pos = new Vector2 (curve[i].time, curve[i].value);
			float curDist = Vector2.Distance(pos, mousePos);
			if (curDist < distance)
			{
				closest.index = i;
				closest.type = SelectionType.Key;
				distance = curDist;
			}
		}

		// Find if selected key is close
		CurveSelection activeKey = m_DragKey != null ? m_DragKey : m_SelectedKey;

		if (activeKey != null)
		{
			// Go through tangents and key
			for (int i=0;i<(int)SelectionType.Count;i++)
			{
				Vector2 pos = GetPosition(curve, new CurveSelection(activeKey.index, (SelectionType)i));
				float curDist = Vector2.Distance(pos, mousePos);
				if (curDist < distance)
				{
					closest.index = activeKey.index;
					closest.type = (SelectionType)i;
					distance = curDist;
				}
			}
		}
						
		outDist = distance;
		if (closest.index != -1)
			return closest;
		else
			return null;
	}
	
	void DrawGrid (Rect pixelRect)
	{
		Rect rect = GetVisibleBounds(pixelRect);
		// To make sure we always render the position label
		
		float pixelsPerUnit = pixelRect.width / rect.width;
		
		float[] grids = { 0.001F, 0.0025F, 0.005F, 0.01F, 0.025F, 0.05F, 0.1F, 0.2F, 0.5F, 1.0F, 2.0F, 5.0F, 10.0F, 20.0F, 50.0F, 100.0F, 200.0F, 500.0F, 1000.0F, 2000.0F, 5000.0F, 10000.0F };
		
		float step = grids[0];
		int i;
		for (i=0;i<grids.Length;i++)
		{
			if (pixelsPerUnit * grids[i] < 75)
			{
				step = grids[i];
			}
		}		

		int boldSteps = 5;
		GUI.color = m_LabelColor;
		
		i = Mathf.FloorToInt(rect.xMin / step) - 1;
		// Draw one extra to make sure we catch the label next to the grid line
		for (;i<rect.xMax / step;i++)
		{
			float x = i * step;
			if (i % boldSteps == 0)
			{
				Vector2 pos = Transform(new Vector2 (x, rect.yMin));
				
				GUI.Label(new Rect(pos.x, pos.y - 20, 50, 20), string.Format("{0:F}", x));
				
				if (i == 0)	
					Handles.color = m_ZeroGridV;
				else
					Handles.color = m_BoldGrid;
			}
			else
				Handles.color = m_LightGrid;
			
			DrawLine(new Vector2 (x, rect.yMin), new Vector2 (x, rect.yMax));
		}

		Handles.color = m_CurrentMarkerGridColor;
		DrawLine(new Vector2 (m_ActiveTime, rect.yMin), new Vector2 (m_ActiveTime, rect.yMax));

		i = Mathf.FloorToInt(rect.yMin / step);
		// Draw one extra to make sure we catch the label next to the grid line
		for (;i<rect.yMax / step + 1;i++)
		{
			float y = i * step;
			if (i % boldSteps == 0)
			{
				Vector2 pos = Transform(new Vector2 (rect.xMin, y));
				GUI.Label(new Rect(pos.x + 10, pos.y, 50, 20), string.Format("{0:F}", y));
				
				if (i == 0)	
					Handles.color = m_ZeroGridH;
				else
					Handles.color = m_BoldGrid;
			}
			else
				Handles.color = m_LightGrid;

			DrawLine(new Vector2 (rect.xMin, y), new Vector2 (rect.xMax, y));
		}
		
		
	}
	
	void DrawCurve (AnimationCurve curve)
	{
		float normalStepSize = 0.05F;
		float initialstepSize = 0.00001F;
		if (curve.length == 0)
			return;

		// Draw curve			
		Vector3 lhs, rhs;
		Handles.color = m_CurveColor;
		float lastPosition = curve[0].value;
		float lastTime = curve[0].time;
		for (int i=0;i<curve.length-1;i++)
		{
			float stepSize = initialstepSize;

			lastTime = curve[i].time;
			lastPosition = curve.Evaluate(curve[i].time);

			for (float f=0.0F;f<1.0F - stepSize * 0.5F;f+=stepSize)
			{
				float newTime = Mathf.Lerp(curve[i].time, curve[i+1].time, f);
				newTime = Mathf.Min(curve[i+1].time, newTime);
				newTime = Mathf.Max(curve[i].time, newTime);
				float newPosition = curve.Evaluate(newTime);
				
				lhs = new Vector3 (lastTime, lastPosition, 0);
				rhs = new Vector3 (newTime, newPosition, 0);
				
				Handles.DrawLine(transform.MultiplyPoint(lhs), transform.MultiplyPoint(rhs));				
				
				lastTime = newTime;
				lastPosition = newPosition;
				if (f != 0.0F)
					stepSize = normalStepSize;
			}
			
			float newTime2 = curve[i+1].time - 0.00001F;
			lhs = new Vector3 (lastTime, lastPosition, 0);
			rhs = new Vector3 (newTime2, curve.Evaluate(newTime2), 0);
			Handles.DrawLine(transform.MultiplyPoint(lhs), transform.MultiplyPoint(rhs));				
		}	

		// Draw all keys (except selected)
		CurveSelection activeKey = m_DragKey != null ? m_DragKey : m_SelectedKey;

		GUI.color = m_KeyColor;
		for (int i=0;i<curve.length;i++)
		{
			if (activeKey != null && i == activeKey.index)
				continue;
			DrawPoint(curve[i].time, curve[i].value);
		}

		// Draw Selected
		if (activeKey != null)
		{
			Vector2 keyPoint = GetPosition(curve, new CurveSelection(activeKey.index, SelectionType.Key));
			Vector2 leftTangent = GetPosition(curve, new CurveSelection(activeKey.index, SelectionType.InTangent));
			Vector2 rightTangent = GetPosition(curve, new CurveSelection(activeKey.index, SelectionType.OutTangent));
			
			GUI.color = activeKey.type == SelectionType.Key ? m_SelectedKeyColor : m_KeyColor;
			DrawPoint(keyPoint.x, keyPoint.y);

			GUI.color = activeKey.type == SelectionType.InTangent ? m_SelectedKeyColor : m_KeyColor;
			DrawPoint(leftTangent.x, leftTangent.y);

			GUI.color = activeKey.type == SelectionType.OutTangent ? m_SelectedKeyColor : m_KeyColor;
			DrawPoint(rightTangent.x, rightTangent.y);
			
			// Draw Handles			
			Handles.color = m_TangentColor;
			DrawLine(leftTangent, keyPoint);
			DrawLine(keyPoint, rightTangent);				
		}
	}
	
	void DrawPoint (float x, float y)
	{
		Vector3 pos = transform.MultiplyPoint(new Vector3 (x, y, 0));
		
		GUI.Label(new Rect (pos.x - 2, pos.y - 2, 4, 4), m_SpaceTexture);
	}

	Vector2 Transform (Vector2 lhs)
	{
		Vector3 a = transform.MultiplyPoint(new Vector3 (lhs.x, lhs.y, 0));
		return a;
	}


	void DrawLine (Vector2 lhs, Vector2 rhs)
	{
		Vector3 a = transform.MultiplyPoint(new Vector3 (lhs.x, lhs.y, 0));
		Vector3 b = transform.MultiplyPoint(new Vector3 (rhs.x, rhs.y, 0));
		Handles.DrawLine(a, b);				
	}
	
}